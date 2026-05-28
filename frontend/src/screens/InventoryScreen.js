import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { getProductsLocal, addProductLocal, getDb } from '../services/LocalDbService';
import { COLORS, SHADOWS } from '../utils/styles';

const InventoryScreen = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await getProductsLocal();
      setProducts(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load inventory.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async () => {
    if (!name || !price || !stock) {
      Alert.alert('Missing Fields', 'Please fill name, price, and stock.');
      return;
    }
    try {
      await addProductLocal(name, parseFloat(price), parseInt(stock), category);
      setModalVisible(false);
      setName('');
      setPrice('');
      setStock('');
      setCategory('');
      fetchProducts();
      Alert.alert('Success', 'Product added to inventory!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add product.');
    }
  };

  const handleDeleteProduct = async (id) => {
    Alert.alert('Delete', 'Are you sure you want to delete this product?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const db = getDb();
          await db.runAsync('DELETE FROM products WHERE id = ?', [id]);
          fetchProducts();
        },
      },
    ]);
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Inventory Management</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.addBtnText}>+ Add New Product</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.searchBar}
        placeholder="🔍 Search products..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {loading && products.length === 0 ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id.toString()}
          refreshing={loading}
          onRefresh={fetchProducts}
          renderItem={({ item }) => (
            <View style={styles.productCard}>
              <View>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productSub}>Category: {item.category || 'N/A'}</Text>
                <Text style={styles.productStock}>Stock: {item.stock}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.productPrice}>Rs. {item.price.toFixed(2)}</Text>
                <TouchableOpacity onPress={() => handleDeleteProduct(item.id)}>
                  <Text style={{ color: COLORS.danger, marginTop: 10 }}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No products found.</Text>}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Product</Text>
            <TextInput style={styles.input} placeholder="Product Name" value={name} onChangeText={setName} />
            <TextInput
              style={styles.input}
              placeholder="Price"
              keyboardType="numeric"
              value={price}
              onChangeText={setPrice}
            />
            <TextInput
              style={styles.input}
              placeholder="Stock Quantity"
              keyboardType="numeric"
              value={stock}
              onChangeText={setStock}
            />
            <TextInput style={styles.input} placeholder="Category" value={category} onChangeText={setCategory} />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddProduct}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.lightBg, padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '900', color: COLORS.textDark },
  addBtn: { backgroundColor: COLORS.primary, padding: 10, borderRadius: 8 },
  addBtnText: { color: '#FFF', fontWeight: 'bold' },
  searchBar: { backgroundColor: '#FFF', padding: 12, borderRadius: 10, marginBottom: 16, borderWidth: 1, borderColor: COLORS.borderLight },
  productCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    ...SHADOWS.small,
  },
  productName: { fontSize: 16, fontWeight: 'bold' },
  productSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  productStock: { fontSize: 13, fontWeight: '600', marginTop: 4 },
  productPrice: { fontSize: 16, fontWeight: '900', color: COLORS.primaryDark },
  emptyText: { textAlign: 'center', marginTop: 50, color: COLORS.textMuted },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', padding: 20, borderRadius: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  input: { backgroundColor: '#F8FAFC', padding: 12, borderRadius: 10, marginBottom: 12, borderWidth: 1, borderColor: COLORS.borderLight },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  cancelBtn: { flex: 0.45, padding: 12, alignItems: 'center' },
  cancelBtnText: { color: COLORS.textMuted, fontWeight: 'bold' },
  saveBtn: { flex: 0.45, backgroundColor: COLORS.primary, padding: 12, borderRadius: 10, alignItems: 'center' },
  saveBtnText: { color: '#FFF', fontWeight: 'bold' },
});

export default InventoryScreen;
