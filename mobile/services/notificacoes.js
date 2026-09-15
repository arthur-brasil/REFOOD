import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

// MVP local (US-09): expo-notifications agendado no cadastro/edição, sem
// servidor de push nem antecedência configurável (isso fica para a US-10).
// Web não suporta notificações locais do Expo — todas as funções viram no-op
// nessa plataforma para não quebrar o app rodando no navegador.
const CHAVE_STORAGE = '@refood:notificacoes';
const DIAS_ANTECEDENCIA = 3; // mesmo limiar usado no badge "Vencendo" (vw_alimentos_status)

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const suportado = () => Platform.OS !== 'web';

const carregarMapa = async () => {
  try {
    const bruto = await AsyncStorage.getItem(CHAVE_STORAGE);
    return bruto ? JSON.parse(bruto) : {};
  } catch {
    return {};
  }
};

const salvarMapa = async (mapa) => {
  try {
    await AsyncStorage.setItem(CHAVE_STORAGE, JSON.stringify(mapa));
  } catch {
    // falha ao persistir o mapa não deve travar o cadastro/edição do alimento
  }
};

export const pedirPermissao = async () => {
  if (!suportado()) return false;
  const atual = await Notifications.getPermissionsAsync();
  if (atual.granted) return true;
  const pedido = await Notifications.requestPermissionsAsync();
  return pedido.granted;
};

// Cancela a notificação agendada de um alimento, se existir
export const cancelarNotificacao = async (alimentoId) => {
  if (!suportado()) return;
  const mapa = await carregarMapa();
  const notifId = mapa[alimentoId];
  if (notifId) {
    await Notifications.cancelScheduledNotificationAsync(notifId).catch(() => {});
    delete mapa[alimentoId];
    await salvarMapa(mapa);
  }
};

// Agenda (ou reagenda) o alerta de vencimento de um alimento, para
// DIAS_ANTECEDENCIA dias antes de data_validade, às 9h. Se a data já
// está mais perto que isso (ou já venceu), não agenda nada.
export const agendarNotificacaoVencimento = async (alimentoId, nome, dataValidade) => {
  if (!suportado()) return;

  await cancelarNotificacao(alimentoId);

  const concedida = await pedirPermissao();
  if (!concedida) return;

  const vencimento = new Date(`${dataValidade}T00:00:00`);
  const disparo = new Date(vencimento);
  disparo.setDate(disparo.getDate() - DIAS_ANTECEDENCIA);
  disparo.setHours(9, 0, 0, 0);

  if (disparo.getTime() <= Date.now()) return;

  const notifId = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Alimento vencendo em breve',
      body: `${nome} vence em ${DIAS_ANTECEDENCIA} dias — confira sua despensa.`,
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: disparo },
  });

  const mapa = await carregarMapa();
  mapa[alimentoId] = notifId;
  await salvarMapa(mapa);
};
