import React from "react";
import Navbar from "./Navbar";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type WrapperProps = {
    children: React.ReactNode;
};

const Wrapper = ({ children }: WrapperProps) => {
    return (
        <div className="min-h-screen bg-base-100">
            <Navbar />

            <main className="mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8 mt-6 md:mt-8 mb-10">
                <ToastContainer
                    position="top-right"
                    autoClose={5000}
                    hideProgressBar={false}
                    newestOnTop={false}
                    closeOnClick
                    pauseOnHover
                    draggable
                />

                {children}
            </main>
        </div>
    );
};

export default Wrapper;