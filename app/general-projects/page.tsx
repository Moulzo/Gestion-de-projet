"use client";
import Reac, { useState } from "react";
import Wrapper from "../components/Wrapper";
import { SquarePlus } from "lucide-react";

const page = () => {

    const [inviteCode, setInviteCode] = useState("")

    return (
        <Wrapper>
            <div className="flex">
                <div className="mb-4">
                    <input
                        value={inviteCode}
                        onChange = {(e) => setInviteCode(e.target.value)}
                        type="text"
                        placeholder="Code d'invitation"
                        className="w-full p-2 input input-bordered"/>
                </div>
                <button className="btn btn-primary ml-4">
                    Rejoindre <SquarePlus className="w-4"/>
                </button>
            </div>
        </Wrapper>
    )
}

export default page