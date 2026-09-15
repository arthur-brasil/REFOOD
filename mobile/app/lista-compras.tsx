import { useState, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import {
  listarListaCompras,
  buscarSugestoesCompras,
  criarItemListaCompras,
  atualizarItemListaCompras,
  deletarItemListaCompras,
} from '../services/api';

export default function ListaCompras() {
  const [itens, setItens] = useState([]);
  const [sugestoes, setSugestoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [novoItem, setNovoItem] = useState('');
  const [adicionando, setAdicionando] = useState(false);

  const carregar = async () => {
    setCarregando(true);
    try {
      const [listaAtual, listaSugestoes] = await Promise.all([
        listarListaCompras(),
        buscarSugestoesCompras(),
      ]);
      setItens(listaAtual);
      setSugestoes(listaSugestoes);
    } catch (err) {
      console.error('Erro ao carregar lista de compras:', err);
    }
    setCarregando(false);
  };

  useFocusEffect(useCallback(() => { carregar(); }, []));

  const adicionarItem = async () => {
    if (!novoItem.trim()) return;
    setAdicionando(true);
    try {
      await criarItemListaCompras({ nome: novoItem.trim() });
      setNovoItem('');
      await carregar();
    } catch (err) {
      console.error('Erro ao adicionar item:', err);
    }
    setAdicionando(false);
  };

  const aceitarSugestao = async (sugestao) => {
    try {
      await criarItemListaCompras({ nome: sugestao.nome, origem: 'sugestao' });
      await carregar();
    } catch (err) {
      console.error('Erro ao aceitar sugestão:', err);
    }
  };

  const alternarComprado = async (item) => {
    try {
      await atualizarItemListaCompras(item.id, {
        nome: item.nome,
        quantidade: item.quantidade,
        unidade: item.unidade,
        comprado: !item.comprado,
      });
      await carregar();
    } catch (err) {
      console.error('Erro ao atualizar item:', err);
    }
  };

  const removerItem = async (id) => {
    try {
      await deletarItemListaCompras(id);
      await carregar();
    } catch (err) {
      console.error('Erro ao remover item:', err);
    }
  };

  const pendentes = itens.filter((i) => !i.comprado);
  const comprados = itens.filter((i) => i.comprado);

  const renderItem = (item) => (
    <View key={item.id} style={styles.card}>
      <TouchableOpacity style={styles.checkboxArea} onPress={() => alternarComprado(item)}>
        <View style={[styles.checkbox, item.comprado && styles.checkboxMarcado]}>
          {item.comprado && <Text style={styles.checkboxTick}>✓</Text>}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.itemNome, item.comprado && styles.itemNomeComprado]}>{item.nome}</Text>
          {(item.quantidade || item.unidade) && (
            <Text style={styles.itemMeta}>
              {item.quantidade ? parseFloat(item.quantidade) : ''} {item.unidade || ''}
            </Text>
          )}
        </View>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => removerItem(item.id)} style={styles.removerBtn}>
        <Text style={styles.removerTexto}>×</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.voltar}>
          <Text style={styles.voltarTexto}>←</Text>
        </TouchableOpacity>
        <Text style={styles.titulo}>Lista de Compras</Text>
      </View>

      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          value={novoItem}
          onChangeText={setNovoItem}
          placeholder="Adicionar item..."
          placeholderTextColor="#8AAB95"
          onSubmitEditing={adicionarItem}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={[styles.addBtn, adicionando && { opacity: 0.6 }]}
          onPress={adicionarItem}
          disabled={adicionando}
        >
          <Text style={styles.addBtnTexto}>+</Text>
        </TouchableOpacity>
      </View>

      {carregando ? (
        <ActivityIndicator size="large" color="#2D6A4F" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={[{ key: 'conteudo' }]}
          keyExtractor={(i) => i.key}
          contentContainerStyle={styles.lista}
          renderItem={() => (
            <>
              {sugestoes.length > 0 && (
                <>
                  <Text style={styles.secaoTitulo}>Sugestões (baseado no seu histórico)</Text>
                  {sugestoes.map((s) => (
                    <View key={s.nome} style={styles.sugestaoCard}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.sugestaoNome}>{s.nome}</Text>
                        <Text style={styles.sugestaoMeta}>
                          {s.categoria} · saiu {s.total_saidas}x nos últimos 60 dias
                        </Text>
                      </View>
                      <TouchableOpacity style={styles.aceitarBtn} onPress={() => aceitarSugestao(s)}>
                        <Text style={styles.aceitarBtnTexto}>Adicionar</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </>
              )}

              <Text style={styles.secaoTitulo}>Pendentes</Text>
              {pendentes.length === 0 ? (
                <Text style={styles.vazio}>Nenhum item pendente</Text>
              ) : (
                pendentes.map(renderItem)
              )}

              {comprados.length > 0 && (
                <>
                  <Text style={styles.secaoTitulo}>Comprados</Text>
                  {comprados.map(renderItem)}
                </>
              )}
            </>
          )}
        />
      )}
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
  addRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  input: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C8E6D4',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#1A2E22',
  },
  addBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#2D6A4F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnTexto: { color: '#FFFFFF', fontSize: 24, fontWeight: '300' },
  lista: { padding: 20, paddingBottom: 40 },
  secaoTitulo: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8AAB95',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 16,
    marginBottom: 8,
  },
  sugestaoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBF4',
    borderWidth: 1,
    borderColor: '#FAC775',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    gap: 10,
  },
  sugestaoNome: { fontSize: 14, fontWeight: '600', color: '#633806' },
  sugestaoMeta: { fontSize: 11, color: '#854F0B', marginTop: 2 },
  aceitarBtn: {
    backgroundColor: '#2D6A4F',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  aceitarBtnTexto: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C8E6D4',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  checkboxArea: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#C8E6D4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxMarcado: { backgroundColor: '#2D6A4F', borderColor: '#2D6A4F' },
  checkboxTick: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  itemNome: { fontSize: 15, fontWeight: '600', color: '#1A2E22' },
  itemNomeComprado: { textDecorationLine: 'line-through', color: '#8AAB95' },
  itemMeta: { fontSize: 12, color: '#8AAB95', marginTop: 2 },
  removerBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  removerTexto: { fontSize: 20, color: '#A32D2D', fontWeight: '400' },
  vazio: { color: '#8AAB95', fontSize: 13, marginBottom: 8 },
});
