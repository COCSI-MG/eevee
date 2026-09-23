import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { PGlite } from '../../../front/node_modules/@electric-sql/pglite/dist/index.js';
const require = createRequire(import.meta.url);
require('reflect-metadata');
const { plainToInstance } = require('class-transformer');
const { validateSync } = require('class-validator');
const { LearningActivityDto } = require('../../dist/src/learning-activity/learning-activity.dto.js');
const { validateActivity, gradeQuiz } = require('../../dist/src/learning-activity/learning-activity.policy.js');
const { classroomCatalog, activitiesFor } = require('../../dist/scripts/classroom/catalog.js');
const { sqlPractice, sqlReferences, architecturePractice } = require('../../dist/scripts/classroom/practice.js');
assert.equal(classroomCatalog.length, 6);
assert.equal(new Set(classroomCatalog.map(c => c.name)).size, 6);
for (const topic of ['sql', 'architecture']) {
  const activities = activitiesFor(topic);
  for (const activity of activities) {
    const dto = plainToInstance(LearningActivityDto, { ...activity, classId: 1 });
    assert.deepEqual(validateSync(dto), []);
    validateActivity(dto);
    assert.equal(dto.published, false);
    assert.equal(dto.feedbackReleased, false);
  }
  const quiz = activities.find(a => a.kind === 'quiz');
  assert.equal(quiz.questions.length, 30);
  assert(quiz.questions.every(q => q.explanation.length > 0));
  assert.equal(gradeQuiz(quiz.questions, quiz.questions.map(q => ({questionId:q.id,choiceId:q.correctChoiceId}))), 1);
  assert.equal(gradeQuiz(quiz.questions, quiz.questions.map(q => ({questionId:q.id,choiceId:q.choices.find(c => c.id !== q.correctChoiceId).id}))), 0);
}
assert.equal(architecturePractice.tasks.length,24);
// Independently calculate the architecture targets from the source problems.
const values=[1024,4*1024**2,300*8/100,1/3.2,16*8+4*4,64/8*800/1000,45,117,255,0.625,parseInt('1101011',2),parseInt('10011100',2),parseInt('11101',2),1/4+1/8,254,4095,170,3054,parseInt('1A3F',16),parseInt('C7',16),parseInt('4B',16),parseInt('9F4A',16),parseInt('1A',16)+parseInt('10110',2),parseInt('2B',16)];
architecturePractice.tasks.forEach((t,i) => assert.equal(Number(t.expectedValue),values[i],t.id));

const db = new PGlite();
try {
  assert.equal(sqlPractice.tasks.length,30);
  for (const task of sqlPractice.tasks) {
    await db.exec('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    await db.exec(sqlPractice.setupSql);
    const initial = (await db.query(task.checkSql)).rows;
    // Every task requires a changed final state, including exploration of errors/rollback.
    assert.notDeepEqual(initial, JSON.parse(task.expectedRows),`${task.id}: passes without student work`);
    await db.exec(sqlReferences[task.id]);
    assert.deepEqual((await db.query(task.checkSql)).rows,JSON.parse(task.expectedRows),task.id);
    await db.exec('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    await db.exec(sqlPractice.setupSql);
    assert.deepEqual((await db.query(task.checkSql)).rows,initial,`${task.id}: reset`);
  }
  // Confirm the errors students are asked to explore, rather than merely their repairs.
  await assert.rejects(db.exec("INSERT INTO alunos VALUES (NULL,'Carlos')"), /null/i);
  await assert.rejects(db.exec("INSERT INTO clientes VALUES (10,'Maria','maria@email.com')"), /unique|duplicate/i);
  await db.exec('BEGIN; UPDATE produtos SET preco=0; ROLLBACK;');
  assert.deepEqual((await db.query('SELECT * FROM produtos ORDER BY id')).rows,[{id:1,preco:100},{id:2,preco:50}]);
  console.log('Classroom catalog passed: 6 classes, 60 quiz questions, 24 numeric tasks, 30 executable SQL tasks, reset and error handling.');
} finally { await db.close(); }
