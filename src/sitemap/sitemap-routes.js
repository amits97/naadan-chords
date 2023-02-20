import React from 'react';
import { Route } from 'react-router';
 
export default (
  <Route>
    <Route path='/:id' />
    <Route path='/page/:number' />
    <Route path='/category/malayalam' />
    <Route path='/category/malayalam/page/:number' />
    <Route path='/category/tamil' />
    <Route path='/category/tamil/page/:number' />
    <Route path='/category/hindi' />
    <Route path='/author/:userName' />
    <Route path='/author/:userName/page/:number' />
    <Route path='/album/:album' />
    <Route path='/about' />
    <Route path='/privacy-policy' />
	</Route>
);