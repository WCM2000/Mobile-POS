import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useSelector } from 'react-redux';
import { getDb, getProductsLocal, addProductLocal } from '../services/LocalDbService';
import { COLORS, SHADOWS } from '../utils/styles';

const { width } = Dimensions.get('window');

const ManagementScreen = () => {
  const settings = useSelector((state) => state.settings);

  // Layout States
  const [activeTab, setActiveTab] = useState('Items'); // Items or Customers
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Data States
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);

  // Modal States
  const [itemModalVisible, setItemModalVisible] = useState(false);
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);

  // Form Fields - Product
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodStock, setProdStock] = useState('');

  // Form Fields - Customer
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custAddress, setCustAddress] = useState('');

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const fetchData = async () => {
    try {
      setLoading(true);
      const db = getDb();
      if (!db) return;

      const [prods, custs] = await Promise.all([
        getProductsLocal(),
        db.getAllAsync('SELECT * FROM customers'),
      ]);
      setProducts(prods);
      setCustomers(custs);
    } catch (error) {
      console.log('Error fetching management data:', error);
      Alert.alert('Load Error', 'Failed to retrieve local registry records.');
    } finally {
      setLoading(false);
    }
  };

  // Product Actions
  const handleOpenItemAdd = () => {
    setEditingItem(null);
    setProdName('');
    setProdPrice('');
    setProdStock('10');
    setItemModalVisible(true);
  };

  const handleOpenItemEdit = (item) => {
    setEditingItem(item);
    setProdName(item.name);
    setProdPrice(item.price.toString());
    setProdStock(item.stock.toString());
    setItemModalVisible(true);
  };

  const handleSaveProduct = async () => {
    if (!prodName || !prodPrice || !prodStock) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    try {
      setLoading(true);
      const db = getDb();
      if (editingItem) {
        await db.runAsync(
          'UPDATE products SET name = ?, price = ?, stock = ?, category = ? WHERE id = ?',
          [prodName, parseFloat(prodPrice), parseInt(prodStock), '', editingItem.id]
        );
        Alert.alert('Success', 'Product updated successfully.');
      } else {
        await addProductLocal(prodName, parseFloat(prodPrice), parseInt(prodStock));
        Alert.alert('Success', 'Product created successfully.');
      }
      setItemModalVisible(false);
      fetchData();
    } catch (err) {
      Alert.alert('Save Failed', 'Could not save product details.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = (id, name) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to permanently delete "${name}" from inventory?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const db = getDb();
              await db.runAsync('DELETE FROM products WHERE id = ?', [id]);
              Alert.alert('Deleted', 'Product removed.');
              fetchData();
            } catch (err) {
              Alert.alert('Error', 'Could not delete product.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Customer Actions
  const handleOpenCustomerAdd = () => {
    setEditingCustomer(null);
    setCustName('');
    setCustPhone('');
    setCustEmail('');
    setCustAddress('');
    setCustomerModalVisible(true);
  };

  const handleOpenCustomerEdit = (cust) => {
    setEditingCustomer(cust);
    setCustName(cust.name);
    setCustPhone(cust.phone || '');
    setCustEmail(cust.email || '');
    setCustAddress(cust.address || '');
    setCustomerModalVisible(true);
  };

  const handleSaveCustomer = async () => {
    if (!custName || !custPhone) {
      Alert.alert('Error', 'Please enter customer name and phone number.');
      return;
    }

    try {
      setLoading(true);
      const db = getDb();
      if (editingCustomer) {
        await db.runAsync(
          'UPDATE customers SET name = ?, phone = ?, email = ?, address = ? WHERE id = ?',
          [custName, custPhone, custEmail, custAddress, editingCustomer.id]
        );
        Alert.alert('Success', 'Customer profile updated.');
      } else {
        await db.runAsync(
          'INSERT INTO customers (name, phone, email, address) VALUES (?, ?, ?, ?)',
          [custName, custPhone, custEmail, custAddress]
        );
        Alert.alert('Success', 'Customer registered successfully.');
      }
      setCustomerModalVisible(false);
      fetchData();
    } catch (err) {
      Alert.alert('Save Failed', 'Could not save customer profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCustomer = (id, name) => {
    Alert.alert(
      'Remove Customer',
      `Delete customer account "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const db = getDb();
              await db.runAsync('DELETE FROM customers WHERE id = ?', [id]);
              Alert.alert('Removed', 'Customer deleted.');
              fetchData();
            } catch (err) {
              Alert.alert('Error', 'Could not delete customer.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Filter lists based on tab & query
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Upper Navigation Tab Switcher */}
      <View style={styles.tabHeader}>
        <View style={styles.tabSwitcher}>
          <TouchableOpacity
            style={[styles.switchTab, activeTab === 'Items' && styles.switchTabActive]}
            onPress={() => {
              setActiveTab('Items');
              setSearchQuery('');
            }}
          >
            <Text style={[styles.switchText, activeTab === 'Items' && styles.switchTextActive]}>
              📦 Inventory Items
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.switchTab, activeTab === 'Customers' && styles.switchTabActive]}
            onPress={() => {
              setActiveTab('Customers');
              setSearchQuery('');
            }}
          >
            <Text style={[styles.switchText, activeTab === 'Customers' && styles.switchTextActive]}>
              👤 Customer Profiles
            </Text>
          </TouchableOpacity>
        </View>

        {/* Add Entry Quick Action */}
        <TouchableOpacity
          style={styles.addBtn}
          onPress={activeTab === 'Items' ? handleOpenItemAdd : handleOpenCustomerAdd}
        >
          <Text style={styles.addBtnText}>
            {activeTab === 'Items' ? '+ Add Product' : '+ Add Customer'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Global Filter Bar */}
      <View style={styles.filterSection}>
        <TextInput
          style={styles.searchBar}
          placeholder={activeTab === 'Items' ? '🔍 Search products by name...' : '🔍 Search by name or phone...'}
          placeholderTextColor={COLORS.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Main Lists Section */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.loadingText}>Fetching registry records...</Text>
        </View>
      ) : activeTab === 'Items' ? (
        /* Inventory List */
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => {
            const isOutOfStock = item.stock <= 0;
            return (
              <View style={styles.itemCard}>
                <View style={styles.cardInfoCol}>
                  <Text style={styles.cardName}>{item.name}</Text>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaPrice}>
                      Price: {settings.currency}{item.price.toFixed(2)}
                    </Text>
                    <View
                      style={[
                        styles.stockBadge,
                        isOutOfStock ? { backgroundColor: '#FEE2E2' } : { backgroundColor: '#E0F2FE' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.stockBadgeText,
                          isOutOfStock ? { color: COLORS.danger } : { color: COLORS.primaryDark },
                        ]}
                      >
                        {isOutOfStock ? 'Out of Stock' : `Qty: ${item.stock}`}
                      </Text>
                    </View>

                  </View>
                </View>

                {/* CRUD Action Buttons */}
                <View style={styles.actionsCol}>
                  <TouchableOpacity
                    style={styles.actionEditBtn}
                    onPress={() => handleOpenItemEdit(item)}
                  >
                    <Text style={styles.actionEditText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionDeleteBtn}
                    onPress={() => handleDeleteProduct(item.id, item.name)}
                  >
                    <Text style={styles.actionDeleteText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No products registered.</Text>
              <Text style={styles.emptySubText}>Tap "+ Add Product" to populate your inventory.</Text>
            </View>
          }
          refreshing={loading}
          onRefresh={fetchData}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      ) : (
        /* Customers List */
        <FlatList
          data={filteredCustomers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => {
            return (
              <View style={styles.itemCard}>
                <View style={styles.cardInfoCol}>
                  <Text style={styles.cardName}>👤 {item.name}</Text>
                  <Text style={styles.custPhone}>📞 {item.phone}</Text>
                  {item.email ? <Text style={styles.custPhone}>✉️ {item.email}</Text> : null}
                  {item.address ? <Text style={styles.custPhone}>🏠 {item.address}</Text> : null}
                </View>

                {/* CRUD Action Buttons */}
                <View style={styles.actionsCol}>
                  <TouchableOpacity
                    style={styles.actionEditBtn}
                    onPress={() => handleOpenCustomerEdit(item)}
                  >
                    <Text style={styles.actionEditText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionDeleteBtn}
                    onPress={() => handleDeleteCustomer(item.id, item.name)}
                  >
                    <Text style={styles.actionDeleteText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No customers registered.</Text>
              <Text style={styles.emptySubText}>Create customer profiles here.</Text>
            </View>
          }
          refreshing={loading}
          onRefresh={fetchData}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}

      {/* Product Detail Modal */}
      <Modal
        visible={itemModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setItemModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingItem ? '✏ Edit Inventory Item' : '📦 Add New Product'}
              </Text>
              <TouchableOpacity onPress={() => setItemModalVisible(false)}>
                <Text style={styles.modalCloseIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView>
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>Product Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. Maliban Milk Powder 400g"
                  placeholderTextColor={COLORS.textMuted}
                  value={prodName}
                  onChangeText={setProdName}
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>Unit Price ({settings.currency}) *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. 1150"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="numeric"
                  value={prodPrice}
                  onChangeText={setProdPrice}
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>Stock Quantity *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. 50"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="numeric"
                  value={prodStock}
                  onChangeText={setProdStock}
                />
              </View>

              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveProduct}>
                <Text style={styles.modalSaveBtnText}>💾 Commit Product details</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Customer Detail Modal */}
      <Modal
        visible={customerModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setCustomerModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingCustomer ? '✏ Edit Customer Account' : '👤 Register New Customer'}
              </Text>
              <TouchableOpacity onPress={() => setCustomerModalVisible(false)}>
                <Text style={styles.modalCloseIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView>
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>Customer Full Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. K. D. Gunawardena"
                  placeholderTextColor={COLORS.textMuted}
                  value={custName}
                  onChangeText={setCustName}
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>Phone Number *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. 0777654321"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="phone-pad"
                  value={custPhone}
                  onChangeText={setCustPhone}
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>Email Address</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. customer@example.com"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="email-address"
                  value={custEmail}
                  onChangeText={setCustEmail}
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>Billing Address (Line by Line)</Text>
                <TextInput
                  style={[styles.modalInput, { height: 80, textAlignVertical: 'top' }]}
                  placeholder="e.g. No. 123&#10;Main Street&#10;Colombo 07"
                  placeholderTextColor={COLORS.textMuted}
                  multiline={true}
                  numberOfLines={4}
                  value={custAddress}
                  onChangeText={setCustAddress}
                />
              </View>

              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveCustomer}>
                <Text style={styles.modalSaveBtnText}>💾 Save Customer Profile</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightBg,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: COLORS.textMuted,
  },
  tabHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.darkBg,
    borderBottomWidth: 1,
    borderColor: COLORS.borderDark,
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    padding: 3,
  },
  switchTab: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  switchTabActive: {
    backgroundColor: COLORS.primary,
  },
  switchText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  switchTextActive: {
    color: COLORS.textWhite,
  },
  addBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    ...SHADOWS.small,
  },
  addBtnText: {
    color: COLORS.textWhite,
    fontSize: 12,
    fontWeight: '800',
  },
  filterSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.lightCard,
  },
  searchBar: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingVertical: 8,
    paddingHorizontal: 14,
    fontSize: 14,
    color: COLORS.textDark,
  },
  itemCard: {
    backgroundColor: COLORS.lightCard,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.small,
  },
  cardInfoCol: {
    flex: 0.72,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  custPhone: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  metaPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textDark,
    marginRight: 10,
  },
  stockBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  stockBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  ledgerLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginRight: 6,
  },
  ledgerValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  actionsCol: {
    flex: 0.28,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionEditBtn: {
    backgroundColor: COLORS.accentLight,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginRight: 6,
  },
  actionEditText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '800',
  },
  actionDeleteBtn: {
    backgroundColor: COLORS.dangerLight,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  actionDeleteText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: '800',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  emptySubText: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 5,
    textAlign: 'center',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.lightCard,
    borderRadius: 20,
    padding: 24,
    width: width * 0.88,
    maxHeight: '80%',
    ...SHADOWS.large,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: COLORS.borderLight,
    paddingBottom: 12,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  modalCloseIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textMuted,
  },
  modalInputGroup: {
    marginBottom: 14,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    color: COLORS.textDark,
  },
  modalSaveBtn: {
    backgroundColor: COLORS.darkBg,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
    ...SHADOWS.medium,
  },
  modalSaveBtnText: {
    color: COLORS.textWhite,
    fontSize: 14,
    fontWeight: '800',
  },
});

export default ManagementScreen;
