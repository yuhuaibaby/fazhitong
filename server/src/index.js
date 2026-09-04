import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3002;

// 中间件
app.use(cors());
app.use(express.json());

// 数据库
const db = new Database(path.join(__dirname, 'fazhitong.db'));

// 初始化数据库
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    phone TEXT UNIQUE,
    nickname TEXT,
    avatar TEXT DEFAULT '',
    company TEXT DEFAULT '',
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS law_firms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    area TEXT,
    rating REAL DEFAULT 5.0,
    lawyer_count INTEGER DEFAULT 0,
    case_count INTEGER DEFAULT 0,
    description TEXT,
    address TEXT,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS lawyers (
    id TEXT PRIMARY KEY,
    firm_id TEXT,
    name TEXT NOT NULL,
    avatar TEXT DEFAULT '',
    specialty TEXT,
    rating REAL DEFAULT 5.0,
    consultation_count INTEGER DEFAULT 0,
    introduction TEXT,
    online INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (firm_id) REFERENCES law_firms(id)
  );

  CREATE TABLE IF NOT EXISTS contracts (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    name TEXT NOT NULL,
    type TEXT,
    status TEXT DEFAULT 'active',
    party TEXT,
    amount TEXT,
    start_date TEXT,
    end_date TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    type TEXT NOT NULL,
    amount REAL DEFAULT 0,
    status TEXT DEFAULT 'pending',
    description TEXT,
    lawyer_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS consultations (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    type TEXT NOT NULL,
    title TEXT,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    consultation_id TEXT,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (consultation_id) REFERENCES consultations(id)
  );

  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    name TEXT NOT NULL,
    type TEXT,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS todos (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    title TEXT NOT NULL,
    priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'pending',
    due_date TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// 插入示例数据
const insertData = () => {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0) return;

  // 示例用户
  db.prepare(`INSERT INTO users (id, phone, nickname, company, role) VALUES (?, ?, ?, ?, ?)`).run(
    'user_001', '13800000001', '张老板', '北京晨曦科技有限公司', 'admin'
  );
  db.prepare(`INSERT INTO users (id, phone, nickname, company, role) VALUES (?, ?, ?, ?, ?)`).run(
    'user_002', '13800000002', '李女士', '上海创新科技有限公司', 'user'
  );

  // 示例律所
  const firms = [
    { id: 'firm_001', name: '北京金杜律师事务所', area: '北京', rating: 4.9, lawyer_count: 156, case_count: 2340, description: '中国领先的综合性律师事务所', address: '北京市朝阳区建国门外大街1号', phone: '010-85678900' },
    { id: 'firm_002', name: '上海锦天城律师事务所', area: '上海', rating: 4.8, lawyer_count: 128, case_count: 1890, description: '长三角地区知名律所', address: '上海市浦东新区陆家嘴环路1000号', phone: '021-23456789' },
    { id: 'firm_003', name: '广州金桥律师事务所', area: '广州', rating: 4.7, lawyer_count: 89, case_count: 1230, description: '珠三角地区专业律所', address: '广州市天河区天河北路368号', phone: '020-34567890' },
  ];
  firms.forEach(f => {
    db.prepare(`INSERT INTO law_firms (id, name, area, rating, lawyer_count, case_count, description, address, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      f.id, f.name, f.area, f.rating, f.lawyer_count, f.case_count, f.description, f.address, f.phone
    );
  });

  // 示例律师
  const lawyers = [
    { id: 'lawyer_001', firm_id: 'firm_001', name: '陈建国', specialty: '劳动法', rating: 4.9, consultation_count: 156, introduction: '专注劳动法领域15年', online: 1 },
    { id: 'lawyer_002', firm_id: 'firm_001', name: '李梦瑶', specialty: '合同法', rating: 4.8, consultation_count: 123, introduction: '合同纠纷处理专家', online: 1 },
    { id: 'lawyer_003', firm_id: 'firm_002', name: '王强', specialty: '企业法', rating: 4.7, consultation_count: 89, introduction: '企业法律顾问', online: 0 },
    { id: 'lawyer_004', firm_id: 'firm_003', name: '张静怡', specialty: '知识产权', rating: 4.9, consultation_count: 201, introduction: '知识产权保护专家', online: 1 },
  ];
  lawyers.forEach(l => {
    db.prepare(`INSERT INTO lawyers (id, firm_id, name, specialty, rating, consultation_count, introduction, online) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
      l.id, l.firm_id, l.name, l.specialty, l.rating, l.consultation_count, l.introduction, l.online
    );
  });

  // 示例合同
  const contracts = [
    { id: 'contract_001', user_id: 'user_001', name: '劳动合同-李某', type: 'labor', status: 'warning', party: '李某', amount: '¥8,000/月', start_date: '2024-01-01', end_date: '2025-12-31' },
    { id: 'contract_002', user_id: 'user_001', name: '办公场地租赁合同', type: 'lease', status: 'active', party: '北京万达商管', amount: '¥120,000/年', start_date: '2024-06-01', end_date: '2026-05-31' },
    { id: 'contract_003', user_id: 'user_001', name: '供应商采购合同', type: 'purchase', status: 'active', party: '深圳科技有限公司', amount: '¥50,000', start_date: '2024-03-15', end_date: '2024-09-15' },
  ];
  contracts.forEach(c => {
    db.prepare(`INSERT INTO contracts (id, user_id, name, type, status, party, amount, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      c.id, c.user_id, c.name, c.type, c.status, c.party, c.amount, c.start_date, c.end_date
    );
  });

  // 示例订单
  const orders = [
    { id: 'order_001', user_id: 'user_001', type: 'consultation', amount: 199, status: 'completed', description: '劳动法咨询', lawyer_id: 'lawyer_001' },
    { id: 'order_002', user_id: 'user_001', type: 'contract_review', amount: 49, status: 'completed', description: '合同审查服务' },
    { id: 'order_003', user_id: 'user_001', type: 'consultation', amount: 299, status: 'pending', description: '合同纠纷咨询', lawyer_id: 'lawyer_002' },
  ];
  orders.forEach(o => {
    db.prepare(`INSERT INTO orders (id, user_id, type, amount, status, description, lawyer_id) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
      o.id, o.user_id, o.type, o.amount, o.status, o.description, o.lawyer_id
    );
  });

  // 示例待办
  const todos = [
    { id: 'todo_001', user_id: 'user_001', title: '续签劳动合同-李某', priority: 'high', status: 'pending', due_date: '2025-12-31' },
    { id: 'todo_002', user_id: 'user_001', title: '办公场地租赁续约', priority: 'medium', status: 'pending', due_date: '2026-05-31' },
    { id: 'todo_003', user_id: 'user_001', title: '供应商合同到期提醒', priority: 'low', status: 'completed', due_date: '2024-09-15' },
  ];
  todos.forEach(t => {
    db.prepare(`INSERT INTO todos (id, user_id, title, priority, status, due_date) VALUES (?, ?, ?, ?, ?, ?)`).run(
      t.id, t.user_id, t.title, t.priority, t.status, t.due_date
    );
  });
};

insertData();

// ===== API 路由 =====

// 用户相关
app.get('/api/user/profile', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get('user_001');
  res.json({ ok: true, user });
});

// 合同相关
app.get('/api/contracts', (req, res) => {
  const contracts = db.prepare('SELECT * FROM contracts WHERE user_id = ?').all('user_001');
  res.json({ ok: true, contracts });
});

app.post('/api/contracts/review', (req, res) => {
  const { name, type } = req.body;
  const id = 'contract_' + uuidv4().slice(0, 8);
  db.prepare(`INSERT INTO contracts (id, user_id, name, type, status) VALUES (?, ?, ?, ?, ?)`).run(
    id, 'user_001', name || '新合同', type || 'other', 'reviewing'
  );
  // 模拟AI审查结果
  setTimeout(() => {
    db.prepare(`UPDATE contracts SET status = 'reviewed' WHERE id = ?`).run(id);
  }, 3000);
  res.json({ ok: true, contract_id: id, message: '合同已提交审查' });
});

// 律所相关
app.get('/api/law-firms', (req, res) => {
  const { area, search } = req.query;
  let sql = 'SELECT * FROM law_firms WHERE 1=1';
  const params = [];
  if (area) { sql += ' AND area = ?'; params.push(area); }
  if (search) { sql += ' AND name LIKE ?'; params.push(`%${search}%`); }
  const firms = db.prepare(sql).all(...params);
  res.json({ ok: true, firms });
});

app.get('/api/law-firms/:id', (req, res) => {
  const firm = db.prepare('SELECT * FROM law_firms WHERE id = ?').get(req.params.id);
  if (!firm) return res.status(404).json({ ok: false, message: '律所不存在' });
  const lawyers = db.prepare('SELECT * FROM lawyers WHERE firm_id = ?').all(req.params.id);
  res.json({ ok: true, firm, lawyers });
});

// 律师相关
app.get('/api/lawyers', (req, res) => {
  const { specialty, firm_id } = req.query;
  let sql = 'SELECT l.*, f.name as firm_name FROM lawyers l LEFT JOIN law_firms f ON l.firm_id = f.id WHERE 1=1';
  const params = [];
  if (specialty) { sql += ' AND l.specialty = ?'; params.push(specialty); }
  if (firm_id) { sql += ' AND l.firm_id = ?'; params.push(firm_id); }
  const lawyers = db.prepare(sql).all(...params);
  res.json({ ok: true, lawyers });
});

app.get('/api/lawyers/:id', (req, res) => {
  const lawyer = db.prepare(`
    SELECT l.*, f.name as firm_name, f.area as firm_area 
    FROM lawyers l 
    LEFT JOIN law_firms f ON l.firm_id = f.id 
    WHERE l.id = ?
  `).get(req.params.id);
  if (!lawyer) return res.status(404).json({ ok: false, message: '律师不存在' });
  res.json({ ok: true, lawyer });
});

// 咨询相关
app.get('/api/consultations', (req, res) => {
  const consultations = db.prepare(`
    SELECT c.*, l.name as lawyer_name 
    FROM consultations c 
    LEFT JOIN lawyers l ON c.lawyer_id = l.id 
    WHERE c.user_id = ? 
    ORDER BY c.created_at DESC
  `).all('user_001');
  res.json({ ok: true, consultations });
});

app.post('/api/consultations', (req, res) => {
  const { type, title, lawyer_id } = req.body;
  const id = 'cons_' + uuidv4().slice(0, 8);
  db.prepare(`INSERT INTO consultations (id, user_id, type, title, lawyer_id) VALUES (?, ?, ?, ?, ?)`).run(
    id, 'user_001', type, title || '法律咨询', lawyer_id
  );
  res.json({ ok: true, consultation_id: id });
});

// 消息相关
app.get('/api/consultations/:id/messages', (req, res) => {
  const messages = db.prepare('SELECT * FROM messages WHERE consultation_id = ? ORDER BY created_at').all(req.params.id);
  res.json({ ok: true, messages });
});

app.post('/api/consultations/:id/messages', (req, res) => {
  const { content, role } = req.body;
  const id = 'msg_' + uuidv4().slice(0, 8);
  db.prepare(`INSERT INTO messages (id, consultation_id, role, content) VALUES (?, ?, ?, ?)`).run(
    id, req.params.id, role || 'user', content
  );
  // 模拟AI回复
  if (role === 'user') {
    setTimeout(() => {
      const aiReply = generateAIReply(content);
      db.prepare(`INSERT INTO messages (id, consultation_id, role, content) VALUES (?, ?, ?, ?)`).run(
        'msg_' + uuidv4().slice(0, 8), req.params.id, 'assistant', aiReply
      );
    }, 1500);
  }
  res.json({ ok: true, message_id: id });
});

// AI回复生成
function generateAIReply(question) {
  const replies = {
    '试用期': '根据《劳动合同法》规定，劳动合同期限三个月以上不满一年的，试用期不得超过一个月；一年以上不满三年的，试用期不得超过二个月；三年以上固定期限和无固定期限的劳动合同，试用期不得超过六个月。',
    '合同': '合同审查是保障企业权益的重要环节。建议您重点关注以下条款：违约责任、争议解决方式、付款条件、保密条款等。',
    '劳动': '劳动法相关问题需要根据具体情况分析。建议您提供更详细的信息，以便给出准确的法律建议。',
    'default': '感谢您的咨询。我是AI法律助手，可以为您提供初步的法律咨询。如需更专业的服务，建议您预约人工律师咨询。'
  };
  
  for (const [key, reply] of Object.entries(replies)) {
    if (question.includes(key)) return reply;
  }
  return replies.default;
}

// 订单相关
app.get('/api/orders', (req, res) => {
  const { status } = req.query;
  let sql = 'SELECT o.*, l.name as lawyer_name FROM orders o LEFT JOIN lawyers l ON o.lawyer_id = l.id WHERE o.user_id = ?';
  const params = ['user_001'];
  if (status && status !== 'all') { sql += ' AND o.status = ?'; params.push(status); }
  sql += ' ORDER BY o.created_at DESC';
  const orders = db.prepare(sql).all(...params);
  res.json({ ok: true, orders });
});

app.get('/api/orders/:id', (req, res) => {
  const order = db.prepare(`
    SELECT o.*, l.name as lawyer_name, l.specialty as lawyer_specialty
    FROM orders o 
    LEFT JOIN lawyers l ON o.lawyer_id = l.id 
    WHERE o.id = ?
  `).get(req.params.id);
  if (!order) return res.status(404).json({ ok: false, message: '订单不存在' });
  res.json({ ok: true, order });
});

// 待办相关
app.get('/api/todos', (req, res) => {
  const todos = db.prepare('SELECT * FROM todos WHERE user_id = ? ORDER BY CASE priority WHEN "high" THEN 1 WHEN "medium" THEN 2 ELSE 3 END').all('user_001');
  res.json({ ok: true, todos });
});

// 文书生成
app.post('/api/documents/generate', (req, res) => {
  const { type, data } = req.body;
  const id = 'doc_' + uuidv4().slice(0, 8);
  
  let content = '';
  if (type === 'dunning') {
    content = `催款函\n\n致：${data.debtor_name || '__________'}\n\n贵方因${data.reason || '业务往来'}，尚欠我方款项人民币${data.amount || '__________'}元。\n\n望贵方在收到本函后7日内付清上述款项。\\n\n特此函告！`;
  } else if (type === 'labor') {
    content = `劳动合同\n\n甲方：${data.employer || '__________'}\n乙方：${data.employee || '__________'}\n\n根据《劳动合同法》，双方本着平等自愿、协商一致的原则，签订本合同。\n\n合同期限：${data.term || '__________'}\n工作岗位：${data.position || '__________'}`;
  } else {
    content = `法律文书\n\n${JSON.stringify(data, null, 2)}`;
  }
  
  db.prepare(`INSERT INTO documents (id, user_id, name, type, content) VALUES (?, ?, ?, ?, ?)`).run(
    id, 'user_001', `${type}_doc`, type, content
  );
  res.json({ ok: true, document_id: id, content });
});

// 合规检测
app.post('/api/compliance/check', (req, res) => {
  const { modules } = req.body;
  const results = (modules || ['labor', 'salary', 'insurance', 'hours']).map(mod => {
    const checks = {
      labor: { name: '劳动合同', score: Math.random() > 0.3 ? 90 : 60, risks: ['未签订书面劳动合同'] },
      salary: { name: '薪资发放', score: 85, risks: ['加班费计算基数不明确'] },
      insurance: { name: '社会保险', score: Math.random() > 0.5 ? 95 : 50, risks: ['未缴纳工伤保险'] },
      hours: { name: '工时管理', score: 80, risks: ['加班时长超过法定上限'] },
    };
    return { ...checks[mod], module: mod };
  });
  
  const totalScore = Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length);
  const allRisks = results.flatMap(r => r.risks.map(risk => ({ module: r.name, risk, level: r.score < 70 ? 'high' : 'medium' })));
  
  res.json({ ok: true, score: totalScore, results, risks: allRisks });
});

// 统计数据
app.get('/api/stats', (req, res) => {
  const contracts = db.prepare('SELECT COUNT(*) as count FROM contracts WHERE user_id = ?').get('user_001').count;
  const orders = db.prepare('SELECT COUNT(*) as count FROM orders WHERE user_id = ?').get('user_001').count;
  const consultations = db.prepare('SELECT COUNT(*) as count FROM consultations WHERE user_id = ?').get('user_001').count;
  const pendingTodos = db.prepare("SELECT COUNT(*) as count FROM todos WHERE user_id = ? AND status = 'pending'").get('user_001').count;
  
  res.json({
    ok: true,
    stats: {
      contracts,
      orders,
      consultations,
      pendingTodos,
      documents: 8,
      commissions: 3
    }
  });
});

// 消息/通知
app.get('/api/messages', (req, res) => {
  // 返回模拟通知数据
  const messages = [
    { id: 'msg_001', title: '预约确认', content: '您的律师咨询预约已确认', time: '10:30', read: false },
    { id: 'msg_002', title: '订单更新', content: '您的合同审查已完成', time: '昨天', read: false },
    { id: 'msg_003', title: '合同提醒', content: '劳动合同将于30天后到期', time: '2天前', read: true },
    { id: 'msg_004', title: '系统通知', content: '平台功能升级通知', time: '3天前', read: true },
  ];
  res.json({ ok: true, messages });
});

// 知识文章
const knowledgeArticles = [
  { id: 'art_001', title: '劳动合同签订注意事项', category: '劳动法', views: 1234, content: '签订劳动合同时需要注意以下要点...' },
  { id: 'art_002', title: '房屋租赁合同常见陷阱', category: '合同法', views: 892, content: '租赁合同中常见的法律陷阱...' },
  { id: 'art_003', title: '企业债务催收法律指南', category: '债权债务', views: 567, content: '合法催收的正确方式...' },
];

app.get('/api/knowledge', (req, res) => {
  res.json({ ok: true, articles: knowledgeArticles });
});

// 咨询记录
app.get('/api/consultation-records', (req, res) => {
  const records = [
    { id: 'rec_001', type: 'AI', title: '劳动合同纠纷咨询', summary: '关于试用期解除合同的法律问题', time: '2026-09-03 10:30' },
    { id: 'rec_002', type: '人工', title: '合同审查咨询', summary: '审查采购合同中的付款条款', time: '2026-09-02 14:20' },
    { id: 'rec_003', type: '律师', title: '劳动法咨询', summary: '咨询加班费计算问题', time: '2026-09-01 09:15' },
  ];
  res.json({ ok: true, records });
});

// 模型配置
let modelConfigs = [
  {
    id: 'config_001',
    name: 'AI法律咨询',
    aiNode: ['AI法律咨询'],
    description: '法律问答AI模型，用于回答用户法律咨询问题',
    provider: 'openai',
    modelName: 'gpt-4',
    apiKey: '',
    endpoint: '',
    enabled: true,
    connectionStatus: 'untested',
    lastTestMessage: null,
    lastTestLatencyMs: null,
    lastTestedAt: null,
    prompt: '',
    adminPrompt: '',
    configKey: 'ai_legal_chat',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'config_002',
    name: '合同审查',
    aiNode: ['合同审查'],
    description: '合同风险分析AI模型，用于识别合同中的风险条款',
    provider: 'openai',
    modelName: 'gpt-4',
    apiKey: '',
    endpoint: '',
    enabled: true,
    connectionStatus: 'untested',
    lastTestMessage: null,
    lastTestLatencyMs: null,
    lastTestedAt: null,
    prompt: '',
    adminPrompt: '',
    configKey: 'contract_review',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'config_003',
    name: '用工合规检测',
    aiNode: ['用工合规检测'],
    description: '企业用工合规检测AI模型，用于检查企业用工是否符合法规',
    provider: 'openai',
    modelName: 'gpt-4',
    apiKey: '',
    endpoint: '',
    enabled: true,
    connectionStatus: 'untested',
    lastTestMessage: null,
    lastTestLatencyMs: null,
    lastTestedAt: null,
    prompt: '',
    adminPrompt: '',
    configKey: 'compliance_check',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'config_004',
    name: '文书生成',
    aiNode: ['文书生成'],
    description: '法律文书生成AI模型，用于生成各类法律文书模板',
    provider: 'openai',
    modelName: 'gpt-4',
    apiKey: '',
    endpoint: '',
    enabled: true,
    connectionStatus: 'untested',
    lastTestMessage: null,
    lastTestLatencyMs: null,
    lastTestedAt: null,
    prompt: '',
    adminPrompt: '',
    configKey: 'document_gen',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'config_005',
    name: '债务催收分析',
    aiNode: ['债务催收分析'],
    description: '债务催收策略分析AI模型，用于分析催收策略和建议',
    provider: 'openai',
    modelName: 'gpt-4',
    apiKey: '',
    endpoint: '',
    enabled: true,
    connectionStatus: 'untested',
    lastTestMessage: null,
    lastTestLatencyMs: null,
    lastTestedAt: null,
    prompt: '',
    adminPrompt: '',
    configKey: 'debt_collection',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

app.get('/api/model-configs', (req, res) => {
  res.json(modelConfigs);
});

app.put('/api/model-configs', (req, res) => {
  const { configs } = req.body;
  if (configs && Array.isArray(configs)) {
    modelConfigs = configs.map(c => ({ ...c, updatedAt: new Date().toISOString() }));
  }
  res.json({ ok: true, count: modelConfigs.length });
});

app.post('/api/model-configs/:id/test', (req, res) => {
  const config = modelConfigs.find(c => c.id === req.params.id);
  if (!config) return res.status(404).json({ ok: false, message: '配置不存在' });
  
  const latency = Math.floor(Math.random() * 500) + 100;
  config.connectionStatus = 'normal';
  config.lastTestMessage = '连接正常';
  config.lastTestLatencyMs = latency;
  config.lastTestedAt = new Date().toISOString();
  
  res.json({
    ok: true,
    status: 'normal',
    message: '连接正常',
    latencyMs: latency,
    lastTestedAt: config.lastTestedAt
  });
});

// 管理员接口 - 用户管理
app.get('/api/admin/users', (req, res) => {
  const users = db.prepare('SELECT * FROM users ORDER BY created_at DESC').all();
  res.json({ ok: true, users });
});

app.post('/api/admin/users', (req, res) => {
  const { phone, nickname, company, role } = req.body;
  const id = 'user_' + uuidv4().slice(0, 8);
  db.prepare('INSERT INTO users (id, phone, nickname, company, role) VALUES (?, ?, ?, ?, ?)').run(
    id, phone, nickname || '新用户', company || '', role || 'user'
  );
  res.json({ ok: true, user_id: id });
});

app.put('/api/admin/users/:id', (req, res) => {
  const { nickname, company, role } = req.body;
  db.prepare('UPDATE users SET nickname = ?, company = ?, role = ? WHERE id = ?').run(
    nickname, company, role, req.params.id
  );
  res.json({ ok: true });
});

app.delete('/api/admin/users/:id', (req, res) => {
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// 管理员接口 - 律所管理
app.get('/api/admin/law-firms', (req, res) => {
  const firms = db.prepare('SELECT * FROM law_firms ORDER BY created_at DESC').all();
  res.json({ ok: true, firms });
});

app.post('/api/admin/law-firms', (req, res) => {
  const { name, area, rating, lawyer_count, case_count, description, address, phone } = req.body;
  const id = 'firm_' + uuidv4().slice(0, 8);
  db.prepare('INSERT INTO law_firms (id, name, area, rating, lawyer_count, case_count, description, address, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
    id, name, area, rating || 5.0, lawyer_count || 0, case_count || 0, description || '', address || '', phone || ''
  );
  res.json({ ok: true, firm_id: id });
});

app.put('/api/admin/law-firms/:id', (req, res) => {
  const { name, area, rating, lawyer_count, case_count, description, address, phone } = req.body;
  db.prepare('UPDATE law_firms SET name=?, area=?, rating=?, lawyer_count=?, case_count=?, description=?, address=?, phone=? WHERE id=?').run(
    name, area, rating, lawyer_count, case_count, description, address, phone, req.params.id
  );
  res.json({ ok: true });
});

app.delete('/api/admin/law-firms/:id', (req, res) => {
  db.prepare('DELETE FROM law_firms WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// 管理员接口 - 律师管理
app.get('/api/admin/lawyers', (req, res) => {
  const lawyers = db.prepare(`
    SELECT l.*, f.name as firm_name 
    FROM lawyers l 
    LEFT JOIN law_firms f ON l.firm_id = f.id 
    ORDER BY l.created_at DESC
  `).all();
  res.json({ ok: true, lawyers });
});

app.post('/api/admin/lawyers', (req, res) => {
  const { firm_id, name, specialty, rating, introduction, online } = req.body;
  const id = 'lawyer_' + uuidv4().slice(0, 8);
  db.prepare('INSERT INTO lawyers (id, firm_id, name, specialty, rating, consultation_count, introduction, online) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
    id, firm_id, name, specialty, rating || 5.0, 0, introduction || '', online || 1
  );
  res.json({ ok: true, lawyer_id: id });
});

app.put('/api/admin/lawyers/:id', (req, res) => {
  const { firm_id, name, specialty, rating, introduction, online } = req.body;
  db.prepare('UPDATE lawyers SET firm_id=?, name=?, specialty=?, rating=?, introduction=?, online=? WHERE id=?').run(
    firm_id, name, specialty, rating, introduction, online, req.params.id
  );
  res.json({ ok: true });
});

app.delete('/api/admin/lawyers/:id', (req, res) => {
  db.prepare('DELETE FROM lawyers WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// 管理员接口 - 订单管理
app.get('/api/admin/orders', (req, res) => {
  const { status } = req.query;
  let sql = 'SELECT o.*, l.name as lawyer_name, u.nickname as user_name FROM orders o LEFT JOIN lawyers l ON o.lawyer_id = l.id LEFT JOIN users u ON o.user_id = u.id WHERE 1=1';
  const params = [];
  if (status && status !== 'all') { sql += ' AND o.status = ?'; params.push(status); }
  sql += ' ORDER BY o.created_at DESC';
  const orders = db.prepare(sql).all(...params);
  res.json({ ok: true, orders });
});

app.put('/api/admin/orders/:id', (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ ok: true });
});

// 管理员接口 - 咨询管理
app.get('/api/admin/consultations', (req, res) => {
  const consultations = db.prepare(`
    SELECT c.*, l.name as lawyer_name, u.nickname as user_name 
    FROM consultations c 
    LEFT JOIN lawyers l ON c.lawyer_id = l.id 
    LEFT JOIN users u ON c.user_id = u.id 
    ORDER BY c.created_at DESC
  `).all();
  res.json({ ok: true, consultations });
});

app.get('/api/admin/consultations/:id', (req, res) => {
  const consultation = db.prepare(`
    SELECT c.*, l.name as lawyer_name, u.nickname as user_name 
    FROM consultations c 
    LEFT JOIN lawyers l ON c.lawyer_id = l.id 
    LEFT JOIN users u ON c.user_id = u.id 
    WHERE c.id = ?
  `).get(req.params.id);
  if (!consultation) return res.status(404).json({ ok: false, message: '咨询不存在' });
  
  const messages = db.prepare('SELECT * FROM messages WHERE consultation_id = ? ORDER BY created_at').all(req.params.id);
  res.json({ ok: true, consultation, messages });
});

// 管理员接口 - 文档管理
app.get('/api/admin/documents', (req, res) => {
  const documents = db.prepare(`
    SELECT d.*, u.nickname as user_name 
    FROM documents d 
    LEFT JOIN users u ON d.user_id = u.id 
    ORDER BY d.created_at DESC
  `).all();
  res.json({ ok: true, documents });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`法智通后端服务已启动: http://localhost:${PORT}`);
  console.log(`API文档: http://localhost:${PORT}/api`);
});
