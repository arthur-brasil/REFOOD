import { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { listarAlimentos } from '../services/api';
import { router } from 'expo-router';

const CATEGORIAS = ['Todos', 'Laticinios', 'Carnes', 'Vegetais', 'Frutas', 'Paes', 'Enlatados'];

export default function Home() {
  const [alimentos, setAlimentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('Todos');

  const carregar = async () => {
    setLoading(true);
    try {
      const dados = await listarAlimentos(filtro === 'Todos' ? null : filtro);
      setAlimentos(dados);
    } catch (err) {
      console.error('Erro ao carregar:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    carregar();
  }, [filtro]);

  // Calcula dias até vencer
  const diasParaVencer = (dataValidade) => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const validade = new Date(dataValidade);
    validade.setHours(0, 0, 0, 0);
    const diff = Math.ceil((validade - hoje) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // Define cor do badge conforme urgência
  const getStatus = (dias) => {
    if (dias < 0) return { texto: 'Vencido', bg: '#FCEBEB', cor: '#A32D2D', card: '#FFF8F8', borda: '#F7C1C1' };
    if (dias === 0) return { texto: 'Hoje', bg: '#FAEEDA', cor: '#854F0B', card: '#FFFBF4', borda: '#FAC775' };
    if (dias <= 3) return { texto: `${dias} dia${dias > 1 ? 's' : ''}`, bg: '#FAEEDA', cor: '#854F0B', card: '#FFFBF4', borda: '#FAC775' };
    return { texto: `${dias} dias`, bg: '#EAF3DE', cor: '#3B6D11', card: '#FFFFFF', borda: '#C8E6D4' };
  };

  const renderItem = ({ item }) => {
    const dias = diasParaVencer(item.data_validade);
    const status = getStatus(dias);

    return (
 <TouchableOpacity
  style={[styles.card, { backgroundColor: status.card, borderColor: status.borda }]}
  onPress={() => router.push(`/${item.id}`)}
>
        <View style={styles.cardInfo}>
          <Text style={styles.cardNome}>{item.nome}</Text>
          <Text style={styles.cardMeta}>
            {item.categoria} · {item.quantidade} {item.unidade}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: status.bg }]}>
          <Text style={[styles.badgeTexto, { color: status.cor }]}>{status.texto}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Minha Despensa</Text>
        <Text style={styles.subtitulo}>{alimentos.length} itens cadastrados</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsContainer}
        contentContainerStyle={styles.chipsContent}
      >
        {CATEGORIAS.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.chip, filtro === cat && styles.chipAtivo]}
            onPress={() => setFiltro(cat)}
          >
            <Text style={[styles.chipTexto, filtro === cat && styles.chipTextoAtivo]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator size="large" color="#2D6A4F" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={alimentos}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.lista}
          ListEmptyComponent={
            <Text style={styles.vazio}>Nenhum alimento cadastrado ainda</Text>
          }
          refreshing={loading}
          onRefresh={carregar}
        />
      )}
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/cadastrar')}>
  <Text style={styles.fabTexto}>+</Text>
</TouchableOpacity>
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
  },
  titulo: { fontSize: 24, fontWeight: '600', color: '#1A2E22' },
  subtitulo: { fontSize: 13, color: '#8AAB95', marginTop: 2 },
  chipsContainer: { maxHeight: 56, backgroundColor: '#FFFFFF' },
  chipsContent: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: '#C8E6D4',
    marginRight: 8,
  },
  chipAtivo: { backgroundColor: '#2D6A4F', borderColor: '#2D6A4F' },
  chipTexto: { fontSize: 13, color: '#4A6358', fontWeight: '500' },
  chipTextoAtivo: { color: '#FFFFFF' },
  lista: { padding: 16, gap: 10 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  fab: {
  position: 'absolute',
  bottom: 24,
  right: 20,
  width: 56,
  height: 56,
  borderRadius: 16,
  backgroundColor: '#2D6A4F',
  alignItems: 'center',
  justifyContent: 'center',
  elevation: 4,
},
fabTexto: { color: '#FFFFFF', fontSize: 28, fontWeight: '300' },
  cardInfo: { flex: 1 },
  cardNome: { fontSize: 15, fontWeight: '600', color: '#1A2E22' },
  cardMeta: { fontSize: 12, color: '#8AAB95', marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 },
  badgeTexto: { fontSize: 11, fontWeight: '700' },
  vazio: { textAlign: 'center', color: '#8AAB95', marginTop: 40, fontSize: 14 },
});