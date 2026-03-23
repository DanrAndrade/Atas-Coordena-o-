from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from . import db

ata_tema = db.Table('ata_tema',
    db.Column('ata_id', db.Integer, db.ForeignKey('ata.id'), primary_key=True),
    db.Column('tema_id', db.Integer, db.ForeignKey('tema.id'), primary_key=True)
)

ata_tag_obs = db.Table('ata_tag_obs',
    db.Column('ata_id', db.Integer, db.ForeignKey('ata.id'), primary_key=True),
    db.Column('tag_obs_id', db.Integer, db.ForeignKey('tag_observacao.id'), primary_key=True)
)

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
    turmas = db.Column(db.String(255), nullable=True)
    disciplina = db.Column(db.String(100), nullable=True)
    
    id_externo_legado = db.Column(db.String(50), nullable=True, unique=True) 
    
    atas = db.relationship('Ata', backref='professor', lazy=True)

class Tema(db.Model):
    __tablename__ = 'tema'
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False, unique=True)

class TagObservacao(db.Model):
    __tablename__ = 'tag_observacao'
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False, unique=True)
    tipo = db.Column(db.String(20), nullable=False) 

class Ata(db.Model):
    __tablename__ = 'ata'
    id = db.Column(db.Integer, primary_key=True)
    professor_id = db.Column(db.Integer, db.ForeignKey('professor.id'), nullable=False)
    coordenador_id = db.Column(db.Integer, nullable=False, default=1) 
    
    data_criacao = db.Column(db.DateTime, default=datetime.utcnow)
    
    observacoes_professor_texto = db.Column(db.Text, nullable=True)
    observacoes_coordenacao_texto = db.Column(db.Text, nullable=True)
    
    registros_portal = db.Column(db.String(20), nullable=False) 
    
    # Armazenando os IDs selecionados como CSV/JSON
    temas_ids = db.Column(db.Text, nullable=True)
    tags_obs_ids = db.Column(db.Text, nullable=True)
    
    compromissos = db.relationship('Compromisso', backref='ata', lazy=True)

class Compromisso(db.Model):
    __tablename__ = 'compromisso'
    id = db.Column(db.Integer, primary_key=True)
    ata_id = db.Column(db.Integer, db.ForeignKey('ata.id'), nullable=False)
    descricao = db.Column(db.String(255), nullable=False)
    ata_origem_id = db.Column(db.Integer, nullable=True) # opcional para saber onde foi gerado, além do ata_id

    
    data_geracao = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    data_prazo_limite = db.Column(db.DateTime, nullable=True)
    data_cumprimento = db.Column(db.DateTime, nullable=True)
    
    status = db.Column(db.String(30), default='pendente', nullable=False)

class Tag(db.Model):
    __tablename__ = 'tag'
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(150), nullable=False)
    # O tipo vai definir se é 'tema' ou 'observacao'
    tipo = db.Column(db.String(50), nullable=False)