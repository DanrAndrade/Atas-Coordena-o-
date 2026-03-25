from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from . import db

class Coordenador(db.Model):
    __tablename__ = 'coordenador'
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(100), nullable=False, unique=True)
    senha_hash = db.Column(db.String(200), nullable=False)

    def set_senha(self, senha):
        self.senha_hash = generate_password_hash(senha)

    def check_senha(self, senha):
        return check_password_hash(self.senha_hash, senha)

class Professor(db.Model):
    __tablename__ = 'professor'
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(150), nullable=False)
    disciplina = db.Column(db.String(100))
    turmas = db.Column(db.String(100))
    atas = db.relationship('Ata', backref='professor', lazy=True)

class Tag(db.Model):
    __tablename__ = 'tag'
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(150), nullable=False)
    tipo = db.Column(db.String(50), nullable=False) # 'tema' ou 'observacao'

class Ata(db.Model):
    __tablename__ = 'ata'
    id = db.Column(db.Integer, primary_key=True)
    professor_id = db.Column(db.Integer, db.ForeignKey('professor.id'), nullable=False)
    coordenador_id = db.Column(db.Integer, db.ForeignKey('coordenador.id'), nullable=False)
    data_criacao = db.Column(db.DateTime, default=datetime.utcnow)
    registros_portal = db.Column(db.String(20), nullable=False)
    observacoes_professor_texto = db.Column(db.Text)
    observacoes_coordenacao_texto = db.Column(db.Text)
    temas_ids = db.Column(db.Text) # JSON list
    tags_obs_ids = db.Column(db.Text) # JSON list
    status = db.Column(db.String(20), default='fechada')
    compromissos = db.relationship('Compromisso', backref='ata', lazy=True)

class Compromisso(db.Model):
    __tablename__ = 'compromisso'
    id = db.Column(db.Integer, primary_key=True)
    ata_id = db.Column(db.Integer, db.ForeignKey('ata.id'), nullable=False)
    descricao = db.Column(db.String(255), nullable=False)
    ata_origem_id = db.Column(db.Integer)
    data_geracao = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    data_prazo_limite = db.Column(db.DateTime)
    data_cumprimento = db.Column(db.DateTime)
    status = db.Column(db.String(20), default='pendente')