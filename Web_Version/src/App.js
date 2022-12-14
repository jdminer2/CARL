import React from "react";
import './App.css';


import {Nav as Greenbar} from './components/Navbar/NavbarElements';
import CombinedLoad from "./pages/CombinedLoad";

function App() {
  return (
    <div className="App">
        <Greenbar/>
        <CombinedLoad/>
    </div>
  );
}
export default App;
