import { useState, useEffect } from 'react';
import { View, Text, SectionList, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { listarAlimentos, buscarResumo } from '../services/api';

const CATEGORIAS = ['Todos', 'Laticinios', 'Carnes', 'Vegetais', 'Frutas', 'Paes', 'Enlatados'];

export default function Home() {
  const [alimentos, setAlimentos] = useState([]);
  const [resumo, setResumo] = useState({ vencido: 0, atencao: 0, em_dia: 0 });
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('Todos');

  const carregar = async () => {
    setLoading(true);
    try {
      const dados = await listarAlimentos(filtro === 'Todos' ? null : filtro);
      setAlimentos(dados);
      const res = await buscarResumo();
      setResumo(res);
    } catch (err) {
      console.error('Erro ao carregar:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    carregar();
  }, [filtro]);

  // Recarrega ao voltar de outra tela
  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [filtro])
  );

  const getStatus = (item) => {
    const dias = item.dias_para_vencer;
    if (item.status === 'vencido') {
      return { texto: 'Vencido', bg: '#FCEBEB', cor: '#A32D2D', card: '#FFF8F8', borda: '#F7C1C1' };
    }
    if (item.status === 'atencao') {
      const texto = dias === 0 ? 'Hoje' : dias === 1 ? 'Amanhã' : `${dias} dias`;
      return { texto, bg: '#FAEEDA', cor: '#854F0B', card: '#FFFBF4', borda: '#FAC775' };
    }
    return { texto: `${dias} dias`, bg: '#EAF3DE', cor: '#3B6D11', card: '#FFFFFF', borda: '#C8E6D4' };
  };

  // Agrupa em secoes: Atencao (vencidos + vencendo) e Em dia
  const atencao = alimentos.filter(a => a.status === 'vencido' || a.status === 'atencao');
  const emDia = alimentos.filter(a => a.status === 'em_dia');

  const secoes = [];
  if (atencao.length > 0) secoes.push({ titulo: 'Atenção', dados: atencao });
  if (emDia.length > 0) secoes.push({ titulo: 'Em dia', dados: emDia });

  const totalAlerta = resumo.vencido + resumo.atencao;

  const renderItem = ({ item }) => {
    const status = getStatus(item);
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: status.card, borderColor: status.borda }]}
        onPress={() => router.push(`/${item.id}`)}
      >
        <View style={styles.cardInfo}>
          <Text style={styles.cardNome}>{item.nome}</Text>
          <Text style={styles.cardMeta}>
            {item.categoria} · {parseFloat(item.quantidade)} {item.unidade}
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

        <View style={styles.stats}>
          <View style={[styles.stat, { backgroundColor: '#EAF3DE' }]}>
            <Text style={[styles.statNum, { color: '#27500A' }]}>{resumo.em_dia}</Text>
            <Text style={[styles.statLbl, { color: '#3B6D11' }]}>Em dia</Text>
          </View>
          <View style={[styles.stat, { backgroundColor: '#FAEEDA' }]}>
            <Text style={[styles.statNum, { color: '#633806' }]}>{resumo.atencao}</Text>
            <Text style={[styles.statLbl, { color: '#854F0B' }]}>Vencendo</Text>
          </View>
          <View style={[styles.stat, { backgroundColor: '#FCEBEB' }]}>
            <Text style={[styles.statNum, { color: '#791F1F' }]}>{resumo.vencido}</Text>
            <Text style={[styles.statLbl, { color: '#A32D2D' }]}>Vencido</Text>
          </View>
        </View>
      </View>

      {totalAlerta > 0 && (
        <View style={styles.banner}>
          <View style={styles.bannerDot} />
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitulo}>
              {totalAlerta} {totalAlerta === 1 ? 'alimento precisa' : 'alimentos precisam'} de atenção
            </Text>
            <Text style={styles.bannerSub}>
              {resumo.vencido > 0 && `${resumo.vencido} vencido${resumo.vencido > 1 ? 's' : ''}`}
              {resumo.vencido > 0 && resumo.atencao > 0 && ' · '}
              {resumo.atencao > 0 && `${resumo.atencao} vencendo em breve`}
            </Text>
          </View>
        </View>
      )}

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
        <SectionList
          sections={secoes.map(s => ({ title: s.titulo, data: s.dados }))}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={styles.secaoTitulo}>{title}</Text>
          )}
          contentContainerStyle={styles.lista}
          ListEmptyComponent={
            <Text style={styles.vazio}>Nenhum alimento cadastrado ainda</Text>
          }
          stickySectionHeadersEnabled={false}
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
  stats: { flexDirection: 'row', gap: 8, marginTop: 14 },
  stat: { flex: 1, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12 },
  statNum: { fontSize: 22, fontWeight: '700', lineHeight: 24 },
  statLbl: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  banner: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FAC775',
    backgroundColor: '#FFFBF4',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bannerDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF9F27',
  },
  bannerTitulo: { fontSize: 13, fontWeight: '600', color: '#633806' },
  bannerSub: { fontSize: 11, color: '#854F0B', marginTop: 1 },
  chipsContainer: { maxHeight: 56 },
  chipsContent: { paddingHorizontal: 16, paddingVertical: 12 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: '#C8E6D4',
    marginRight: 8,
    backgroundColor: '#FFFFFF',
  },
  chipAtivo: { backgroundColor: '#2D6A4F', borderColor: '#2D6A4F' },
  chipTexto: { fontSize: 13, color: '#4A6358', fontWeight: '500' },
  chipTextoAtivo: { color: '#FFFFFF' },
  lista: { paddingHorizontal: 16, paddingBottom: 90 },
  secaoTitulo: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8AAB95',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 12,
    marginBottom: 8,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardInfo: { flex: 1 },
  cardNome: { fontSize: 15, fontWeight: '600', color: '#1A2E22' },
  cardMeta: { fontSize: 12, color: '#8AAB95', marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 },
  badgeTexto: { fontSize: 11, fontWeight: '700' },
  vazio: { textAlign: 'center', color: '#8AAB95', marginTop: 40, fontSize: 14 },
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
});