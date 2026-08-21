import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { buscarAlimento, atualizarAlimento, deletarAlimento } from '../services/api';

const CATEGORIAS = ['Laticinios', 'Carnes', 'Vegetais', 'Frutas', 'Paes', 'Enlatados'];
const UNIDADES = ['unidade', 'litro', 'kg', 'gramas', 'pacote'];
const LOCAIS = ['Geladeira', 'Freezer', 'Despensa'];

export default function Detalhe() {
  const { id } = useLocalSearchParams();
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [erro, setErro] = useState('');

  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [unidade, setUnidade] = useState('');
  const [dataValidade, setDataValidade] = useState('');
  const [local, setLocal] = useState('');

  useEffect(() => {
    const carregar = async () => {
      try {
        const item = await buscarAlimento(id);
        setNome(item.nome);
        setCategoria(item.categoria);
        setQuantidade(String(parseFloat(item.quantidade)));
        setUnidade(item.unidade);
        setDataValidade(item.data_validade.split('T')[0]);
        setLocal(item.local_armazenamento || 'Geladeira');
      } catch (err) {
        setErro('Não foi possível carregar o alimento');
      }
      setCarregando(false);
    };
    carregar();
  }, [id]);

  const salvar = async () => {
    setErro('');

    if (!nome.trim()) {
      setErro('Informe o nome do alimento');
      return;
    }
    if (!dataValidade.match(/^\d{4}-\d{2}-\d{2}$/)) {
      setErro('Data inválida. Use o formato AAAA-MM-DD');
      return;
    }

    setSalvando(true);
    try {
      const resultado = await atualizarAlimento(id, {
        nome: nome.trim(),
        categoria,
        quantidade: parseFloat(quantidade) || 1,
        unidade,
        data_validade: dataValidade,
        local_armazenamento: local,
      });

      if (resultado.erro) {
        setErro(resultado.erro);
        setSalvando(false);
        return;
      }

      router.back();
    } catch (err) {
      setErro('Não foi possível salvar as alterações');
    }
    setSalvando(false);
  };

  const excluir = async () => {
    try {
      await deletarAlimento(id);
      router.back();
    } catch (err) {
      setErro('Não foi possível excluir o alimento');
    }
  };

  if (carregando) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#2D6A4F" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.voltar}>
          <Text style={styles.voltarTexto}>←</Text>
        </TouchableOpacity>
        <Text style={styles.titulo}>Editar Alimento</Text>
      </View>

      <ScrollView contentContainerStyle={styles.form}>
        <View style={styles.grupo}>
          <Text style={styles.label}>Nome do alimento</Text>
          <TextInput style={styles.input} value={nome} onChangeText={setNome} />
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

        <View style={styles.grupo}>
          <Text style={styles.label}>Quantidade</Text>
          <TextInput
            style={styles.input}
            value={quantidade}
            onChangeText={setQuantidade}
            keyboardType="numeric"
          />
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

        {erro ? <Text style={styles.erro}>{erro}</Text> : null}

        <TouchableOpacity
          style={[styles.botao, salvando && { opacity: 0.6 }]}
          onPress={salvar}
          disabled={salvando}
        >
          <Text style={styles.botaoTexto}>
            {salvando ? 'Salvando...' : 'Salvar Alterações'}
          </Text>
        </TouchableOpacity>

        {!confirmando ? (
          <TouchableOpacity style={styles.botaoExcluir} onPress={() => setConfirmando(true)}>
            <Text style={styles.botaoExcluirTexto}>Excluir Alimento</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.confirmacao}>
            <Text style={styles.confirmacaoTexto}>
              Tem certeza? Esta ação não pode ser desfeita.
            </Text>
            <View style={styles.confirmacaoBotoes}>
              <TouchableOpacity style={styles.btnCancelar} onPress={() => setConfirmando(false)}>
                <Text style={styles.btnCancelarTexto}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnConfirmar} onPress={excluir}>
                <Text style={styles.btnConfirmarTexto}>Sim, excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
  erro: {
    color: '#A32D2D',
    fontSize: 13,
    backgroundColor: '#FCEBEB',
    padding: 12,
    borderRadius: 10,
    textAlign: 'center',
  },
  botao: {
    backgroundColor: '#2D6A4F',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  botaoTexto: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  botaoExcluir: {
    borderWidth: 1,
    borderColor: '#F7C1C1',
    backgroundColor: '#FFF8F8',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  botaoExcluirTexto: { color: '#A32D2D', fontSize: 14, fontWeight: '600' },
  confirmacao: {
    backgroundColor: '#FFF8F8',
    borderWidth: 1,
    borderColor: '#F7C1C1',
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  confirmacaoTexto: {
    color: '#A32D2D',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  confirmacaoBotoes: { flexDirection: 'row', gap: 10 },
  btnCancelar: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#C8E6D4',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  btnCancelarTexto: { color: '#4A6358', fontSize: 14, fontWeight: '600' },
  btnConfirmar: {
    flex: 1,
    backgroundColor: '#A32D2D',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  btnConfirmarTexto: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
});