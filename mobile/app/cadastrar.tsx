import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { criarAlimento } from '../services/api';

const CATEGORIAS = ['Laticinios', 'Carnes', 'Vegetais', 'Frutas', 'Paes', 'Enlatados'];
const UNIDADES = ['unidade', 'litro', 'kg', 'gramas', 'pacote'];
const LOCAIS = ['Geladeira', 'Freezer', 'Despensa'];

export default function Cadastrar() {
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('Laticinios');
  const [quantidade, setQuantidade] = useState('1');
  const [unidade, setUnidade] = useState('unidade');
  const [dataValidade, setDataValidade] = useState('');
  const [local, setLocal] = useState('Geladeira');
  const [salvando, setSalvando] = useState(false);

  const salvar = async () => {
    if (!nome.trim()) {
      Alert.alert('Atenção', 'Informe o nome do alimento');
      return;
    }
    if (!dataValidade.match(/^\d{4}-\d{2}-\d{2}$/)) {
      Alert.alert('Atenção', 'Data inválida. Use o formato AAAA-MM-DD');
      return;
    }

    setSalvando(true);
    try {
      await criarAlimento({
        nome: nome.trim(),
        categoria,
        quantidade: parseFloat(quantidade) || 1,
        unidade,
        data_validade: dataValidade,
        local_armazenamento: local,
      });
      router.back();
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível salvar o alimento');
    }
    setSalvando(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.voltar}>
          <Text style={styles.voltarTexto}>←</Text>
        </TouchableOpacity>
        <Text style={styles.titulo}>Cadastrar Alimento</Text>
      </View>

      <ScrollView contentContainerStyle={styles.form}>
        <View style={styles.grupo}>
          <Text style={styles.label}>Nome do alimento</Text>
          <TextInput
            style={styles.input}
            value={nome}
            onChangeText={setNome}
            placeholder="Ex: Leite Integral"
            placeholderTextColor="#8AAB95"
          />
        </View>

        <View style={styles.grupo}>
          <Text style={styles.label}>Categoria</Text>
          <View style={styles.opcoes}>
            {CATEGORIAS.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.opcao, categoria === cat && styles.opcaoAtiva]}
                onPress={() => setCategoria(cat)}
              >
                <Text style={[styles.opcaoTexto, categoria === cat && styles.opcaoTextoAtivo]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.linha}>
          <View style={[styles.grupo, { flex: 1 }]}>
            <Text style={styles.label}>Quantidade</Text>
            <TextInput
              style={styles.input}
              value={quantidade}
              onChangeText={setQuantidade}
              keyboardType="numeric"
              placeholder="1"
              placeholderTextColor="#8AAB95"
            />
          </View>
        </View>

        <View style={styles.grupo}>
          <Text style={styles.label}>Unidade</Text>
          <View style={styles.opcoes}>
            {UNIDADES.map((un) => (
              <TouchableOpacity
                key={un}
                style={[styles.opcao, unidade === un && styles.opcaoAtiva]}
                onPress={() => setUnidade(un)}
              >
                <Text style={[styles.opcaoTexto, unidade === un && styles.opcaoTextoAtivo]}>
                  {un}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.grupo}>
          <Text style={styles.label}>Data de validade</Text>
          <TextInput
            style={styles.input}
            value={dataValidade}
            onChangeText={setDataValidade}
            placeholder="AAAA-MM-DD"
            placeholderTextColor="#8AAB95"
          />
        </View>

        <View style={styles.grupo}>
          <Text style={styles.label}>Local de armazenamento</Text>
          <View style={styles.opcoes}>
            {LOCAIS.map((loc) => (
              <TouchableOpacity
                key={loc}
                style={[styles.opcao, local === loc && styles.opcaoAtiva]}
                onPress={() => setLocal(loc)}
              >
                <Text style={[styles.opcaoTexto, local === loc && styles.opcaoTextoAtivo]}>
                  {loc}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.botao, salvando && { opacity: 0.6 }]}
          onPress={salvar}
          disabled={salvando}
        >
          <Text style={styles.botaoTexto}>
            {salvando ? 'Salvando...' : 'Salvar Alimento'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4FAF6' },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#C8E6D4',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  voltar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EAF3DE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voltarTexto: { fontSize: 18, color: '#2D6A4F' },
  titulo: { fontSize: 18, fontWeight: '600', color: '#1A2E22' },
  form: { padding: 20, gap: 18 },
  grupo: { gap: 6 },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4A6358',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C8E6D4',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#1A2E22',
  },
  linha: { flexDirection: 'row', gap: 12 },
  opcoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  opcao: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: '#C8E6D4',
    backgroundColor: '#FFFFFF',
  },
  opcaoAtiva: { backgroundColor: '#2D6A4F', borderColor: '#2D6A4F' },
  opcaoTexto: { fontSize: 13, color: '#4A6358', fontWeight: '500' },
  opcaoTextoAtivo: { color: '#FFFFFF' },
  botao: {
    backgroundColor: '#2D6A4F',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  botaoTexto: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});