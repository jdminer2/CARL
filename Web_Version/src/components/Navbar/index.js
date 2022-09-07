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
import Menu from '@mui/material';


/** This is the top green bar that allows the user to navigate all the pages */
const Navbar = () => {
    // Variables for opening and closing dropdown menu
    const [menuAnchor, setMenuAnchor] = React.useState(null);
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
                    <NavLink to='/distributed_load' activeStyle>
                        Distributed Load
                    </NavLink>
                    <NavLink to='/single_load' activeStyle>
                        Single Load
                    </NavLink>
                    <NavLink to='/multiple_loads' activeStyle>
                        Multiple Load
                    </NavLink>
                    <NavLink to='/ce325'>
                        CE 325
                    </NavLink>
                    <NavLink to='/cantilever_beam'>
                        Cantilever Beam
                    </NavLink>
                    <NavLink to='/combined_load'>
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
                <NavLink to='/distributed_load' activeStyle>
                    Distributed Load
                </NavLink>
                <NavLink to='/single_load' activeStyle>
                    Single Load
                </NavLink>
                <NavLink to='/multiple_loads' activeStyle>
                    Multiple Load
                </NavLink>
                <NavLink to='/ce325'>
                    CE 325
                </NavLink>
                <NavLink to='/cantilever_beam'>
                    Cantilever Beam
                </NavLink>
                <NavLink to='/combined_load'>
                    Combined Loads
                </NavLink>
            </Menu>
        </>
    );
};

export default Navbar;