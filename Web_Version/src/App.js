import React from "react";
import './App.css';


import Navbar from './components/Navbar';
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import MultipleLoads from './pages/multiple_loads';
import About from './pages/distributed_load';
import SingleLoad from './pages/single_load';
import CantileverBeam from "./pages/cantilever_beam";
import Home from './pages';
import Ce325 from "./pages/ce325";
import CombinedLoad from "./pages/CombinedLoad";

function App() {
  return (
    <div className="App">
      <Router>
        <Navbar />
        <Routes>
          <Route path='/' exact element={<Home/>}/>
          <Route path='/distributed_load' element={<About/>} />
          <Route path='/multiple_loads' element={<MultipleLoads/>} />
          <Route path='/single_load' element={<SingleLoad/>} />
          <Route path='/ce325' element={<Ce325/>} />
          <Route path='/cantilever_beam' element={<CantileverBeam/>} />
          <Route path='/combined_load' element={<CombinedLoad/>} />
        </Routes>
      </Router>
    </div>
  );
}
export default App;
