import React from 'react'
import { useAuth } from '../../context/AuthContext'

const Dashboard = () => {
    const { user } = useAuth()
    return (
        <div> Assistant Dashboard - Welcome {user?.name} </div>
    )
}

export default Dashboard