import {Link} from "react-router";

export const ReportMenu = () => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link
                to={`/reports/monthly`}
                className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors flex flex-col"
            >
                <h3 className="text-xl font-bold mb-2">Měsíční přehled</h3>
                <p className="text-gray-400">Přehled příjmů a výdajů za kalendářní měsíc</p>
            </Link>
        </div>
    )
}