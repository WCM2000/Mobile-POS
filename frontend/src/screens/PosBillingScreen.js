import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { addToCart, clearCart } from '../redux/cartSlice';
import PrinterService from '../services/PrinterService';
import ApiService from '../services/ApiService';

const { width } = Dimensions.get('window');

const PosBillingScreen = () => {
  const dispatch = useDispatch();
  const { items, subTotal, taxAmount, grandTotal } = useSelector((state) => state.cart);
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Fetch products from backend on load
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getProducts();
      setProducts(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load products from server.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (items.length === 0) {
      Alert.alert('Empty Cart', 'Please add items before checking out.');
      return;
    }

    try {
      setCheckoutLoading(true);

      // Step 1: Prepare Invoice Data for Backend
      const invoiceData = {
        invoiceNumber: `INV-${Date.now()}`, // Unique invoice number
        items: items.map(item => ({
          productId: item._id, // Mapping backend _id
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        subTotal,
        taxAmount,
        grandTotal,
        paymentMethod: 'Cash', // Default for now
        status: 'Paid',
      };

      // Step 2: Save to Backend
      await ApiService.saveInvoice(invoiceData);
      
      // Step 3: Print Receipt (Only if save was successful)
      try {
        await PrinterService.printReceipt(items, subTotal, taxAmount, grandTotal);
      } catch (printError) {
        console.log('Printing error:', printError);
        Alert.alert('Print Error', 'Invoice saved but printer failed to respond.');
      }

      // Step 4: Finalize
      Alert.alert('Success', 'Order processed and invoice saved!');
      dispatch(clearCart());
      
    } catch (error) {
      console.log('Checkout Error:', error);
      Alert.alert('Checkout Failed', 'Could not save invoice to server. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const renderProductItem = ({ item }) => (
    <View style={styles.productCard}>
      <Text style={styles.productName}>{item.name}</Text>
      <Text style={styles.productPrice}>₹{item.price}</Text>
      <Text style={styles.stockInfo}>Stock: {item.stockQuantity}</Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => dispatch(addToCart({ ...item, id: item._id }))}
      >
        <Text style={styles.addButtonText}>Add +</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCartItem = ({ item }) => (
    <View style={styles.cartItem}>
      <Text style={styles.cartItemText}>{item.name} x {item.quantity}</Text>
      <Text style={styles.cartItemPrice}>₹{(item.price * item.quantity).toFixed(2)}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={styles.loadingText}>Loading Products...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Product List Section (70%) */}
      <View style={styles.productListSection}>
        <View style={styles.headerRow}>
          <Text style={styles.sectionHeader}>Menu Items</Text>
          <TouchableOpacity onPress={fetchProducts}>
            <Text style={styles.refreshText}>Refresh</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={products}
          renderItem={renderProductItem}
          keyExtractor={(item) => item._id}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>No products found. Add some in the backend!</Text>}
        />
      </View>

      {/* Shopping Cart Summary Section (30%) */}
      <View style={styles.cartSummarySection}>
        <Text style={styles.cartHeader}>Shopping Cart</Text>
        <FlatList
          data={items}
          renderItem={renderCartItem}
          keyExtractor={(item) => item.id}
          style={styles.cartList}
        />
        
        <View style={styles.totalContainer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>₹{subTotal.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax (6%):</Text>
            <Text style={styles.totalValue}>₹{taxAmount.toFixed(2)}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>Grand Total:</Text>
            <Text style={styles.grandTotalValue}>₹{grandTotal.toFixed(2)}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.checkoutButton, checkoutLoading && styles.disabledButton]} 
          onPress={handleCheckout}
          disabled={checkoutLoading}
        >
          {checkoutLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.checkoutButtonText}>Checkout / Print Bill</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 10,
    color: '#6c757d',
  },
  productListSection: {
    flex: 0.7,
    padding: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  refreshText: {
    color: '#007BFF',
    marginRight: 10,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    marginLeft: 5,
  },
  listContent: {
    paddingBottom: 20,
  },
  productCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    margin: 8,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 5,
    textAlign: 'center',
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#28A745',
    marginBottom: 2,
  },
  stockInfo: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    color: '#6c757d',
  },
  cartSummarySection: {
    flex: 0.3,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
  },
  cartHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 10,
  },
  cartList: {
    maxHeight: 80,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  cartItemText: {
    color: '#212529',
    fontSize: 14,
  },
  cartItemPrice: {
    color: '#212529',
    fontWeight: '600',
  },
  totalContainer: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    paddingTop: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  totalLabel: {
    color: '#6c757d',
    fontSize: 13,
  },
  totalValue: {
    color: '#212529',
    fontSize: 13,
  },
  grandTotalRow: {
    marginTop: 5,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#28A745',
  },
  checkoutButton: {
    backgroundColor: '#28A745',
    marginTop: 15,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
  },
  disabledButton: {
    backgroundColor: '#94d3a2',
  },
  checkoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PosBillingScreen;
