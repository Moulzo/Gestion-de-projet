import Wrapper from "@/app/components/Wrapper";
import React from "react";

const page = ({ params }: { params: Promise<{ projectId: string }> }) => {
    return (
        <Wrapper>
            <div>
                page
            </div>
        </Wrapper>
    )
}

export default page