const express = require('express');
const server = express();

server.use(express.json());

let alunos = [];
let cursos = [];
let nextAlunoId = 1;
let nextCursoId = 1;

// Middleware para validação de aluno
const validarAluno = (req, res, next) => {
  const { nome, matricula } = req.body;
  
  if (!nome || !matricula) {
    return res.status(400).json({ 
      erro: 'Nome e matricula são obrigatórios' 
    });
  }
  
  next();
};

// Middleware para validação de curso
const validarCurso = (req, res, next) => {
  const { nome, codigo, cargaHoraria } = req.body;
  
  if (!nome || !codigo || !cargaHoraria) {
    return res.status(400).json({ 
      erro: 'Nome, código e carga horária são obrigatórios' 
    });
  }
  
  next();
};

// Alunos
server.post('/alunos', validarAluno, (req, res) => {
  const { nome, matricula, cursos: cursosAluno } = req.body;
  
  const novoAluno = {
    id: nextAlunoId++,
    nome,
    matricula,
    cursos: cursosAluno || []
  };
  
  alunos.push(novoAluno);
  res.status(201).json(novoAluno);
});

server.get('/alunos', (req, res) => {
  res.json(alunos);
});

server.get('/alunos/:id', (req, res) => {
  const aluno = alunos.find((a) => a.id == parseInt(req.params.id));
  
  if (!aluno) {
    return res.status(404).json({ erro: 'Aluno não encontrado' });
  }
  
  res.json(aluno);
});

server.put('/alunos/:id', validarAluno, (req, res) => {
  const alunoIndex = alunos.findIndex((a) => a.id == parseInt(req.params.id));
  
  if (alunoIndex === -1) {
    return res.status(404).json({ erro: 'Aluno não encontrado' });
  }
  
  const { nome, matricula, cursos: cursosAluno } = req.body;
  
  alunos[alunoIndex] = {
    id: alunos[alunoIndex].id,
    nome,
    matricula,
    cursos: cursosAluno || []
  };
  
  res.json(alunos[alunoIndex]);
});

server.patch('/alunos/:id', (req, res) => {
  const alunoIndex = alunos.findIndex((a) => a.id == parseInt(req.params.id));
  
  if (alunoIndex === -1) {
    return res.status(404).json({ erro: 'Aluno não encontrado' });
  }
  
  const { nome, matricula, cursos: cursosAluno } = req.body;
  
  if (nome) alunos[alunoIndex].nome = nome;
  if (matricula) alunos[alunoIndex].matricula = matricula;
  if (cursosAluno) alunos[alunoIndex].cursos = cursosAluno;
  
  res.json(alunos[alunoIndex]);
});

server.delete('/alunos/:id', (req, res) => {
  const alunoIndex = alunos.findIndex((a) => a.id == parseInt(req.params.id));
  
  if (alunoIndex === -1) {
    return res.status(404).json({ erro: 'Aluno não encontrado' });
  }
  
  alunos.splice(alunoIndex, 1);
  res.json({ mensagem: 'Aluno deletado com sucesso' });
});

// Cursos
server.post('/cursos', validarCurso, (req, res) => {
  const { nome, codigo, cargaHoraria } = req.body;
  
  const novoCurso = {
    id: nextCursoId++,
    nome,
    codigo,
    cargaHoraria
  };
  
  cursos.push(novoCurso);
  res.status(201).json(novoCurso);
});

server.get('/cursos', (req, res) => {
  res.json(cursos);
});

server.get('/cursos/:id', (req, res) => {
  const curso = cursos.find((c) => c.id == parseInt(req.params.id));
  
  if (!curso) {
    return res.status(404).json({ erro: 'Curso não encontrado' });
  }
  
  res.json(curso);
});

server.put('/cursos/:id', validarCurso, (req, res) => {
  const cursoIndex = cursos.findIndex((c) => c.id == parseInt(req.params.id));
  
  if (cursoIndex === -1) {
    return res.status(404).json({ erro: 'Curso não encontrado' });
  }
  
  const { nome, codigo, cargaHoraria } = req.body;
  
  cursos[cursoIndex] = {
    id: cursos[cursoIndex].id,
    nome,
    codigo,
    cargaHoraria
  };
  
  res.json(cursos[cursoIndex]);
});

server.patch('/cursos/:id', (req, res) => {
  const cursoIndex = cursos.findIndex((c) => c.id == parseInt(req.params.id));
  
  if (cursoIndex === -1) {
    return res.status(404).json({ erro: 'Curso não encontrado' });
  }
  
  const { nome, codigo, cargaHoraria } = req.body;
  
  if (nome) cursos[cursoIndex].nome = nome;
  if (codigo) cursos[cursoIndex].codigo = codigo;
  if (cargaHoraria) cursos[cursoIndex].cargaHoraria = cargaHoraria;
  
  res.json(cursos[cursoIndex]);
});

server.delete('/cursos/:id', (req, res) => {
  const cursoIndex = cursos.findIndex((c) => c.id == parseInt(req.params.id));
  
  if (cursoIndex === -1) {
    return res.status(404).json({ erro: 'Curso não encontrado' });
  }
  
  cursos.splice(cursoIndex, 1);
  res.json({ mensagem: 'Curso deletado com sucesso' });
});

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}

module.exports = server;