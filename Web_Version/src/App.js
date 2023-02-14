import React from "react"
import './App.css'

import {BrowserRouter as Router, Routes, Route} from 'react-router-dom'

import CombinedLoad from "./pages/CombinedLoad"
import MobilePage from "./pages/MobilePage"

function App() {
  return (
    <div className="App">
        <Router>
            <Routes>
                <Route path="/mobile_app" element={
                    <MobilePage/>
                }/>
                <Route path="/*" element={
                    <CombinedLoad/>
                }/>
            </Routes>
        </Router>
    </div>
  )
}
export default App
