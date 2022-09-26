# STEPS TO BUILD A NEW PAGE
If your new page name is xyz, then below "page_name" gets replaced by xyz. Step 1's folder would be named xyz_app.
1. Make a folder called page_name_app inside src.
2. Inside page_name_app make pageNameApp.js file. Inside this file place the following code. The function name must start with a capital letter, so name it as PageNameApp.
```javascript
import '../App.css'
import React, { useEffect, useState} from 'react';
function PageNameApp(){
    //your code here
    return(<div>Your Render code here</div>)
}
export default PageNameApp;
```
3. Make a file called page_name.js in ./src/pages. Place the following code in here.
```javascript
import React from 'react';
import PageNameApp from "../page_name_app/pageNameApp";
const PageName = () => {
    return (
        <PageNameApp/>
    );
};

export default PageName;
```
4. Open ./src/App.js and place the following code in routes section. Dont forget to import PageName from ./pages/page_name
```javascript
<Route path='/new_page' element={<PageName/>} />
```
5. To make the page reachable from the top bar, open ./src/components/Navbar/index.js. There, insert the following in the NavMenu section and in the Menu section:
```javascript
<NavLink reloadDocument={currentPage === "new_page"} onClick={()=>{setCurrentPage("new_page")}} to='/new_page' activeStyle>
    New Page
</NavLink>
```
6. To make the page reachable from the home page menu, open ./src/pages/index.js. In the selectDestination function, add a condition for the function to return './new_page'.