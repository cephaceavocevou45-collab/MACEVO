import { Outlet } from "react-router-dom";

function EditorLayout() {
    return (
        <div className="h-screen overflow-hidden bg-gray-100">

            <Outlet />

        </div>
    );
}

export default EditorLayout;