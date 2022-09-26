// eslint-disable-next-line no-unused-vars
import React from 'react';
import {
    Nav,
    NavLink,
    Bars,
    NavMenu,
    NavBtn,
    NavBtnLink,
} from './NavbarElements';
import Menu from '@mui/material/Menu';


/** This is the top green bar that allows the user to navigate all the pages */
const Navbar = () => {
    // Variables for opening and closing dropdown menu
    const [menuAnchor, setMenuAnchor] = React.useState(null);
    const [currentPage, setCurrentPage] = React.useState("");
    const open = Boolean(menuAnchor);

    // Functions for opening and closing dropdown menu
    function handleBarsClick(event) {
        setMenuAnchor(event.currentTarget);
    }
    function handleCloseMenu(event) {
        setMenuAnchor(null);
    }

    return (
        <>
            <Nav>
                {/* Button to view a dropdown menu if screen is too small to list all options */}
                <Bars onClick={handleBarsClick}/>
                {/* List of options*/}
                <NavMenu>
                    <NavLink reloadDocument={currentPage === ""} onClick={()=>{setCurrentPage("")}} to='/' activeStyle>
                        Home
                    </NavLink>
                    <NavLink reloadDocument={currentPage === "distributed_load"} onClick={()=>{setCurrentPage("distributed_load")}} to='/distributed_load' activeStyle>
                        Distributed Load
                    </NavLink>
                    <NavLink reloadDocument={currentPage === "single_load"} onClick={()=>{setCurrentPage("single_load")}} to='/single_load' activeStyle>
                        Single Load
                    </NavLink>
                    <NavLink reloadDocument={currentPage === "multiple_loads"} onClick={()=>{setCurrentPage("multiple_loads")}} to='/multiple_loads' activeStyle>
                        Multiple Load
                    </NavLink>
                    <NavLink reloadDocument={currentPage === "ce325"} onClick={()=>{setCurrentPage("ce325")}} to='/ce325'>
                        CE 325
                    </NavLink>
                    <NavLink reloadDocument={currentPage === "cantilever_beam"} onClick={()=>{setCurrentPage("cantilever_beam")}} to='/cantilever_beam'>
                        Cantilever Beam
                    </NavLink>
                    <NavLink reloadDocument={currentPage === "combined_load"} onClick={()=>{setCurrentPage("combined_load")}} to='/combined_load'>
                        Combined Loads
                    </NavLink>
                </NavMenu>
            </Nav>
            {/* Dropdown menu listing all buttons */}
            <Menu
                anchorEl={menuAnchor}
                open={open}
                onClose={handleCloseMenu}
                onClick={handleCloseMenu}
            >
                <NavLink reloadDocument={currentPage === ""} onClick={()=>{setCurrentPage("")}} to='/' activeStyle>
                    Home
                </NavLink>
                <NavLink reloadDocument={currentPage === "distributed_load"} onClick={()=>{setCurrentPage("distributed_load")}} to='/distributed_load' activeStyle>
                    Distributed Load
                </NavLink>
                <NavLink reloadDocument={currentPage === "single_load"} onClick={()=>{setCurrentPage("single_load")}} to='/single_load' activeStyle>
                    Single Load
                </NavLink>
                <NavLink reloadDocument={currentPage === "multiple_loads"} onClick={()=>{setCurrentPage("multiple_loads")}} to='/multiple_loads' activeStyle>
                    Multiple Load
                </NavLink>
                <NavLink reloadDocument={currentPage === "ce325"} onClick={()=>{setCurrentPage("ce325")}} to='/ce325'>
                    CE 325
                </NavLink>
                <NavLink reloadDocument={currentPage === "cantilever_beam"} onClick={()=>{setCurrentPage("cantilever_beam")}} to='/cantilever_beam'>
                    Cantilever Beam
                </NavLink>
                <NavLink reloadDocument={currentPage === "combined_load"} onClick={()=>{setCurrentPage("combined_load")}} to='/combined_load'>
                    Combined Loads
                </NavLink>
            </Menu>
        </>
    );
};

export default Navbar;