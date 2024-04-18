import React, { useRef, useState } from 'react'
import { FaEdit } from "react-icons/fa";
import { IoMdCheckmark } from "react-icons/io";
import { MdOutlineSubdirectoryArrowRight } from "react-icons/md";
import axios from "axios";

const Row = (props) => {
    var { data, level, dataChanged, userObj } = props;
    const [edit, setEdit] = useState(true);
    const [ip, setIp] = useState(data.title);
    var padd = 20 * level;
    var paddLeft = padd.toString() + "px";
    const editButtonClickedHandler = () => {
        setEdit(false);
    };

    const auth = {
        auth: {
            username: '',
            password: userObj.pat
        },
        headers: {
            'Content-Type': 'application/json-patch+json',
        }
    }

    const saveHandler = (e) => {
        e.preventDefault();
        axios.patch(`https://dev.azure.com/${userObj.org}/${userObj.prj}/_apis/wit/workitems/${data.id}?api-version=6.0`, [{
            "op": "Add",
            "path": "/fields/System.Title",
            "from": null,
            "value": ip
        }], auth).then((response) => {
            setEdit(true);
            dataChanged();
        }).catch(() => {

        });
    };

    return (
        <div>
            {
                level === 1 && (
                    <hr className="mb-2"></hr>
                )
            }
            <div className="flex mb-4 items-center">
                <div className="mr-4 text-sm font-semibold w-[13px]">{data.id}</div>
                <div style={{ paddingLeft: paddLeft }} className="flex items-center">
                    {
                        !edit && (
                            <div className="flex items-center">
                                {
                                    level > 1 && (
                                        <MdOutlineSubdirectoryArrowRight className="mr-2 opacity-60" />
                                    )
                                }
                                <input value={ip} onChange={(e) => setIp(e.target.value)} className="w-3/4 outline-none px-4 py-1 border rounded-lg focus:border-[#182625]"></input>
                                <button onClick={saveHandler}>
                                    <IoMdCheckmark className="ms-2 opacity-80 cursor-pointer" />
                                </button>

                            </div>
                        )
                    }

                    {
                        edit && (
                            <div className="flex items-center">
                                {
                                    level > 1 && (
                                        <MdOutlineSubdirectoryArrowRight className="mr-2 opacity-60" />
                                    )
                                }
                                <div className="">{data.title}</div>
                                <FaEdit className="ms-2 opacity-60 cursor-pointer" onClick={editButtonClickedHandler} />
                            </div>
                        )
                    }
                </div>
            </div>

            {
                data.children.map((child, index) => (
                    <Row data={child} key={index} level={level + 1} dataChanged={() => dataChanged()} userObj={userObj}></Row>
                ))
            }
        </div>
    )
}

export default Row