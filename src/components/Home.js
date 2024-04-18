import React, { useEffect, useState } from 'react'
import axios from "axios";
import Row from "./Row.js";

const Home = () => {
    const [parentChildArray, setParentChildArray] = useState([]);
    const [pat, setPat] = useState("");
    const [org, setOrg] = useState("");
    const [prj, setPrj] = useState("");
    const [error, setError] = useState("");

    const userObj = {
        pat,
        org,
        prj
    }

    const auth = {
        auth: {
            username: '',
            password: pat
        }
    }
    const fecthAllNodes = () => {
        setParentChildArray([]);
        var parents = []
        axios.post(`https://dev.azure.com/${org}/${prj}/_apis/wit/wiql?api-version=6`, {
            "query": "SELECT [System.Id], [System.Title], [System.State], [System.AssignedTo] FROM WorkItemLinks WHERE ([System.Links.LinkType] = 'System.LinkTypes.Hierarchy-Forward' ) MODE (Recursive)"
        }, auth).then((response) => {
            var workItemRelations = response.data.workItemRelations;
            workItemRelations.forEach((item) => {
                if (!item.source) {
                    parents.push(item.target.id);
                }
            });
            fecthParentChildRelationship(parents);
        }).catch((error) => {
            setError("Some error occured")
        });
    };

    const fecthParentChildRelationship = (parents) => {
        for (var i = 0; i < parents.length; i++) {
            axios.post(`https://dev.azure.com/${org}/${prj}/_apis/wit/wiql?api-version=6`, {
                "query": `SELECT [System.Id], [System.Title], [System.State], [System.AssignedTo] FROM WorkItemLinks WHERE ([Source].[System.Id] = ${parents[i]} AND [System.Links.LinkType] = 'System.LinkTypes.Hierarchy-Forward' ) MODE (Recursive)`
            }, auth).then((response) => {
                formParentChildTree(response.data.workItemRelations);
            });
        }
    };

    const formParentChildTree = (workItemRelations) => {
        fetchTitle(workItemRelations).then(() => {
            var result = {}
            workItemRelations.forEach((item) => {
                if (!item.source) {
                    result = {
                        id: item.target.id,
                        children: [],
                        title: item.target.title,
                        type: item.target.type
                    }
                } else {
                    var node = {
                        id: item.target.id,
                        children: [],
                        title: item.target.title,
                        type: item.target.type
                    }
                    appendNode(result, node, item.source.id);
                }
            });
            setParentChildArray(parentChildArray => [...parentChildArray, result]);
        })
    };

    const appendNode = (result, node, sourceId) => {
        if (result.id === sourceId) {
            return result.children.push(node);
        } else {
            for (var i = 0; i < result.children.length; i++) {
                var obj = result.children[i];
                if (obj.id === sourceId) {
                    return obj.children.push(node);
                } else {
                    return appendNode(obj, node, sourceId);
                }
            };
        }
    };

    const fetchTitle = (workItemRelations) => {
        return new Promise(async (resolve, reject) => {
            // var promises = [];
            for (var i = 0; i < workItemRelations.length; i++) {
                var item = workItemRelations[i];
                const [title, type] = await call(item);
                item.target.title = title;
                item.target.type = type;
            }
            resolve();
        });
    };

    const call = async (item) => {
        return new Promise(async (resolve, reject) => {
            const response = await axios.get(item.target.url, auth);
            resolve([response.data.fields["System.Title"], response.data.fields["System.WorkItemType"]]);
        })
    }

    const submitHandler = (e) => {
        e.preventDefault();
        if (!pat || !org || !prj) {
            setError("Please fill all the above fields!");
            setTimeout(() => {
                setError(null);
            }, 3000);
            return;
        }
        // return;
        fecthAllNodes();
    };

    var level = 0;
    return (
        <div className="font-poppins h-screen overflow-hidden w-full">
            <div className="flex justify-center mt-28 ">
                <div className="w-[780px] flex">
                    <div className="w-1/2">
                        <input value={pat} onChange={(e) => setPat(e.target.value)} placeholder="PAT" className="w-3/4 text-sm outline-none px-4 py-2 border rounded-lg focus:border-[#182625] mb-4"></input>
                        <input value={org} onChange={(e) => setOrg(e.target.value)} placeholder="Organization Name" className="text-sm w-3/4 outline-none px-4 py-2 border rounded-lg focus:border-[#182625] mb-4"></input>
                        <input value={prj} onChange={(e) => setPrj(e.target.value)} placeholder="Project Name" className="text-sm w-3/4 outline-none px-4 py-2 border rounded-lg focus:border-[#182625] mb-4"></input>
                        <button className="w-3/4 rounded-lg border px-4 py-2 bg-[#103778] hover:opacity-80 text-white font-semibold" onClick={submitHandler}>
                            <span>Get Workitems Tree</span>
                        </button>
                        {
                            error && (
                                <div className="font-semibold text-[#E3371E] mt-2">{error}</div>
                            )
                        }
                    </div>
                    <div className="w-1/2 p-8 border rounded-lg shadow-lg">
                        <div className="flex font-semibold">
                            <div className="mr-8 mb-2 ">Id</div>
                            <div>Title</div>
                        </div>
                        {
                            parentChildArray.map((item, index) => (
                                <Row data={item} key={index} level={level + 1} dataChanged={() => fecthAllNodes()} userObj={userObj}></Row>
                            ))
                        }
                    </div>
                </div>

            </div>
        </div>
    )
}


export default Home
