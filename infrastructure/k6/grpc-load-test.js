import grpc from 'k6/net/grpc';
import { check, sleep } from 'k6';
import { randomString, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

const GRPC_HOST = __ENV.GRPC_TARGET || 'promotion-grpc:7003';

// Клиент загружает proto-определения, чтобы знать какие методы и сообщения существуют
const client = new grpc.Client();
client.load(['/proto'], 'promo.proto', 'greet.proto');

export const options = {
  scenarios: {
    // Основная нагрузка — чтение промо-акций по ID каталожного товара
    read_promo: {
      executor: 'constant-arrival-rate',
      rate: 80,
      timeUnit: '1s',
      duration: '5m',
      preAllocatedVUs: 30,
      maxVUs: 100,
      exec: 'readPromo',
    },

    // Создание промо-акций
    create_promo: {
      executor: 'constant-arrival-rate',
      rate: 20,
      timeUnit: '1s',
      duration: '5m',
      preAllocatedVUs: 10,
      maxVUs: 40,
      exec: 'createPromo',
    },

    // Вспомогательный Greeter-сервис — для разнообразия нагрузки по методам
    greeter: {
      executor: 'constant-arrival-rate',
      rate: 20,
      timeUnit: '1s',
      duration: '5m',
      preAllocatedVUs: 10,
      maxVUs: 30,
      exec: 'greeter',
    },

    // Намеренные ошибки — пустые ID, несуществующие записи
    error_requests: {
      executor: 'constant-arrival-rate',
      rate: 10,
      timeUnit: '1s',
      duration: '5m',
      preAllocatedVUs: 5,
      maxVUs: 20,
      exec: 'errorRequests',
    },
  },
};

export default function () { }

// plaintext: true — gRPC без TLS (внутри Docker-сети шифрование не нужно)
function connect() {
  client.connect(GRPC_HOST, { plaintext: true, timeout: '5s' });
}

// Чтение — запрос GetPromoByCatalogItem с разными UUID.
// Большинство вернут NotFound — это нормально и создаёт разнообразие кодов на дашборде.
export function readPromo() {
  connect();

  const uuids = [
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '11111111-1111-1111-1111-111111111111',
    randomString(8) + '-' + randomString(4) + '-' + randomString(4) + '-' + randomString(4) + '-' + randomString(12),
  ];

  const catalogItemId = uuids[randomIntBetween(0, uuids.length - 1)];

  // client.invoke — unary вызов gRPC-метода. Формат: "package.Service/Method"
  const res = client.invoke('promotion.PromotionService/GetPromoByCatalogItem', {
    catalog_item_id: catalogItemId,
  });

  check(res, {
    'read: status OK or NotFound': (r) =>
      r.status === grpc.StatusOK || r.status === grpc.StatusNotFound,
  });

  client.close();
  sleep(0.01);
}

// Создание промо-акции с рандомными данными
export function createPromo() {
  connect();

  const res = client.invoke('promotion.PromotionService/CreatePromo', {
    catalog_item_id: `${randomString(8)}-${randomString(4)}-${randomString(4)}-${randomString(4)}-${randomString(12)}`,
    title: `Promo ${randomString(6)}`,
    value: `${randomIntBetween(5, 50)}%`,
  });

  check(res, {
    'create: status OK': (r) => r.status === grpc.StatusOK,
  });

  client.close();
  sleep(0.01);
}

// Greeter — простой тестовый gRPC-сервис (SayHello / Add)
export function greeter() {
  connect();

  const variant = randomIntBetween(0, 1);

  if (variant === 0) {
    const res = client.invoke('greet.Greeter/SayHello', {
      name: `User_${randomString(4)}`,
    });

    check(res, {
      'hello: status OK': (r) => r.status === grpc.StatusOK,
    });
  } else {
    const a = randomIntBetween(1, 100);
    const b = randomIntBetween(1, 100);

    const res = client.invoke('greet.Greeter/Add', { a: a, b: b });

    check(res, {
      'add: status OK': (r) => r.status === grpc.StatusOK,
    });
  }

  client.close();
  sleep(0.01);
}

// Ошибочные запросы — каждый вариант провоцирует определённый gRPC error code
export function errorRequests() {
  connect();

  const variant = randomIntBetween(0, 3);

  switch (variant) {
    case 0:
      // Пустой catalog_item_id — вероятно Internal или InvalidArgument
      client.invoke('promotion.PromotionService/GetPromoByCatalogItem', {
        catalog_item_id: '',
      });
      break;

    case 1:
      // Update несуществующей записи — NotFound или Internal
      client.invoke('promotion.PromotionService/UpdatePromo', {
        id: 'non-existent-id',
        title: 'fail',
        value: '0%',
      });
      break;

    case 2:
      // Delete с пустым id
      client.invoke('promotion.PromotionService/DeletePromo', {
        catalog_item_id: '',
      });
      break;

    case 3:
      // Создание с пустыми полями
      client.invoke('promotion.PromotionService/CreatePromo', {
        catalog_item_id: '',
        title: '',
        value: '',
      });
      break;
  }

  client.close();
  sleep(0.05);
}
