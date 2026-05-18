import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import MainLayout from './components/layout/MainLayout';
import Home from './pages/Home';
import CategoryBrowse from './pages/CategoryBrowse';
import VehicleSearchResults from './pages/VehicleSearchResults';
import ProductList from './pages/ProductList';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import OEMCatalogue from './pages/OEMCatalogue';
import OEMModelSelect from './pages/OEMModelSelect';
import Account from './pages/Account';
import Login from './pages/Login';
import Signup from './pages/Signup';
import { setActiveCartUser } from './store/slices/cartSlice';
import './App.css';

function App() {
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);

  useEffect(() => {
    const userKey = auth?.isAuthenticated
      ? auth?.user?.email || auth?.user?.username || 'guest'
      : 'guest';
    dispatch(setActiveCartUser(userKey));
  }, [dispatch, auth?.isAuthenticated, auth?.user?.email, auth?.user?.username]);

  return (
    <Router>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/categories" element={<CategoryBrowse />} />
          <Route path="/categories/:categoryId" element={<CategoryBrowse />} />
          <Route path="/vehicle-parts" element={<VehicleSearchResults />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/products/:id" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/oem-catalogue" element={<OEMCatalogue />} />
          <Route path="/oem-catalogue/:makerId" element={<OEMModelSelect />} />
          <Route path="/account" element={<Account />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
      </MainLayout>
    </Router>
  );
}

export default App;
