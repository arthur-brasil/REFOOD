import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { buscarRelatorioDesperdicio } from '../services/api';

export default function Relatorio() {
  const [resumo, setResumo] = useState({ total_descartado: 0, total_consumido: 0 });
  const [porCategoria, setPorCategoria] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = async () => {
    setCarregando(true);
    try {
      const dados = await buscarRelatorioDesperdicio();
      setResumo(dados.resumo);
      setPorCategoria(dados.por_categoria);
    } catch (err) {
      console.error('Erro ao carregar relatório:', err);
    }
    setCarregando(false);
  };

  useFocusEffect(useCallback(() => { carregar(); }, []));

  const totalSaidas = resumo.total_descartado + resumo.total_consumido;
  const pctDesperdicio = totalSaidas > 0
    ? Math.round((resumo.total_descartado / totalSaidas) * 100)
    : 0;

  const renderCategoria = ({ item }) => {
    const totalCategoria = item.total_descartado + item.total_consumido;
    const pct = totalCategoria > 0 ? Math.round((item.total_descartado / totalCategoria) * 100) : 0;
    return (
      <View style={styles.card}>
        <View style={styles.cardTopo}>
          <Text style={styles.cardNome}>{item.categoria}</Text>
          <Text style={styles.cardPct}>{pct}% descartado</Text>
        </View>
        <View style={styles.barraFundo}>
          <View style={[styles.barraPreenchida, { width: `${pct}%` }]} />
        </View>
        <View style={styles.cardLinhas}>
          <Text style={styles.cardDetalhe}>
            🗑️ {item.total_descartado} descartado{item.total_descartado !== 1 ? 's' : ''}
            {item.quantidade_descartada > 0 ? ` (${item.quantidade_descartada})` : ''}
          </Text>
          <Text style={styles.cardDetalhe}>✅ {item.total_consumido} consumido{item.total_consumido !== 1 ? 's' : ''}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.voltar}>
          <Text style={styles.voltarTexto}>←</Text>
        </TouchableOpacity>
        <Text style={styles.titulo}>Relatório de Desperdício</Text>
      </View>

      {carregando ? (
        <ActivityIndicator size="large" color="#2D6A4F" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={porCategoria}
          keyExtractor={(item) => item.categoria}
          renderItem={renderCategoria}
          contentContainerStyle={styles.lista}
          ListHeaderComponent={
            <>
              <View style={styles.resumoRow}>
                <View style={[styles.resumoCard, { backgroundColor: '#FCEBEB' }]}>
                  <Text style={[styles.resumoNum, { color: '#791F1F' }]}>{resumo.total_descartado}</Text>
                  <Text style={[styles.resumoLbl, { color: '#A32D2D' }]}>Descartados</Text>
                </View>
                <View style={[styles.resumoCard, { backgroundColor: '#EAF3DE' }]}>
                  <Text style={[styles.resumoNum, { color: '#27500A' }]}>{resumo.total_consumido}</Text>
                  <Text style={[styles.resumoLbl, { color: '#3B6D11' }]}>Consumidos</Text>
                </View>
              </View>

              {totalSaidas > 0 && (
                <View style={styles.faixaGeral}>
                  <Text style={styles.faixaTexto}>
                    {pctDesperdicio}% do que saiu da despensa foi desperdício
                  </Text>
                </View>
              )}

              <Text style={styles.secaoTitulo}>Por categoria</Text>
            </>
          }
          ListEmptyComponent={
            <Text style={styles.vazio}>Ainda não há histórico suficiente para gerar o relatório</Text>
          }
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
  lista: { padding: 20, paddingBottom: 40 },
  resumoRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  resumoCard: { flex: 1, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  resumoNum: { fontSize: 28, fontWeight: '700' },
  resumoLbl: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  faixaGeral: {
    backgroundColor: '#FFFBF4',
    borderWidth: 1,
    borderColor: '#FAC775',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  faixaTexto: { color: '#854F0B', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  secaoTitulo: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8AAB95',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C8E6D4',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  cardTopo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  cardNome: { fontSize: 15, fontWeight: '600', color: '#1A2E22' },
  cardPct: { fontSize: 12, fontWeight: '700', color: '#A32D2D' },
  barraFundo: { height: 6, borderRadius: 3, backgroundColor: '#EAF3DE', overflow: 'hidden' },
  barraPreenchida: { height: 6, backgroundColor: '#E4685D', borderRadius: 3 },
  cardLinhas: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  cardDetalhe: { fontSize: 12, color: '#4A6358' },
  vazio: { textAlign: 'center', color: '#8AAB95', marginTop: 40, fontSize: 14 },
});
