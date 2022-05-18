# STEPS TO BUILD A NEW PAGE
Let us say your new page name is xyz. Sow below <page_name> gets replaced by xyz.
1. Make a folder called <page_name>_app inside src.
2. Inside <page_name>_app make <page_name>app.js file. Inside this file place the following code. The function name must start with a capital letter. Here say the name is new page. so name it as NewPageApp.
```javascript
import '../App.css'
import React, { useEffect, useState} from 'react';
function PageNameApp(){
    //your code here
    return(<div>Your Render code here</div>)
}
export default PageNameApp;
```
3. Make a file called <page_name>.js ./src/pages. So say for example if PageNameApp is what we named our function earlier. Place the following code in here.
```javascript
import React from 'react';
import DistributedLoadApp from "../distributed_load_app/distributedLoadApp";
const PageName = () => {
    return (
        <PageNameApp/>
    );
};

export default PageName;
```
4. Go ./src/components/Navbar/index.js. There in side the NavMenu section insert the following:
```javascript
<NavLink to='/new_page' activeStyle>
    New Page
</NavLink>
```
5. Open ./src/app.js and place the following code in routes section. Dont forget to import PageName from ./pages/PageName
```javascript
<Route path='/new_page' element={<PageName/>} />
```
6. Now restarting the app will show you the new page being displayed in the menu.