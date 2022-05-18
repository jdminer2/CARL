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

const Navbar = () => {
    return (
        <>
            <Nav>
                <Bars />
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
        </>
    );
};

export default Navbar;