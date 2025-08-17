import {Link} from "react-router";
import {UserButton} from "@clerk/react-router";

export const ReportHeader = () =>{
    return (
        <header className="flex justify-between items-center mb-8">
            <Link to="/" className="text-2xl font-bold hover:text-gray-300 transition-colors">
                TraAIcker
            </Link>
            <UserButton />
        </header>
    )
}