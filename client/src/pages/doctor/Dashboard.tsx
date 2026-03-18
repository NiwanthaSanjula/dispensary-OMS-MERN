
import { useAuth } from '../../context/AuthContext'

const Dashboard = () => {
    const { user } = useAuth();

    return (
        <div>Doctor Dashboard - Welcome {user?.name}</div>
    )
}

export default Dashboard