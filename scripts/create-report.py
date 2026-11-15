from pathlib import Path
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.enum.text import WD_BREAK
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT

root=Path(__file__).resolve().parent.parent
doc=Document()
section=doc.sections[0]
section.top_margin=section.bottom_margin=Inches(.7)
section.left_margin=section.right_margin=Inches(.75)
section.page_width=Inches(8.27);section.page_height=Inches(11.69)
for name in ['Normal','Title','Subtitle','Heading 1','Heading 2']:
    st=doc.styles[name];st.font.name='Calibri';st.font.color.rgb=RGBColor(0,0,0)
doc.styles['Normal'].font.size=Pt(10.5)
doc.styles['Normal'].paragraph_format.space_after=Pt(7)
doc.styles['Normal'].paragraph_format.line_spacing=1.1
doc.styles['Title'].font.size=Pt(26)
doc.styles['Heading 1'].font.size=Pt(17)
doc.styles['Heading 2'].font.size=Pt(12)

def p(text,style=None): return doc.add_paragraph(text,style)
def h(text): doc.add_heading(text,1)
def sub(text): doc.add_heading(text,2)
def page(): doc.add_page_break()
def link(label,url):
    para=doc.add_paragraph()
    hyper=OxmlElement('w:hyperlink');rid=para.part.relate_to(url,'http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink',is_external=True);hyper.set(qn('r:id'),rid)
    run=OxmlElement('w:r');props=OxmlElement('w:rPr');color=OxmlElement('w:color');color.set(qn('w:val'),'154B73');props.append(color);run.append(props);text=OxmlElement('w:t');text.text=label;run.append(text);hyper.append(run);para._p.append(hyper)
def table(headers,rows,widths):
    t=doc.add_table(rows=1,cols=len(headers));t.alignment=WD_TABLE_ALIGNMENT.CENTER;t.autofit=False
    for i,w in enumerate(widths): t.columns[i].width=Inches(w)
    for i,s in enumerate(headers):t.rows[0].cells[i].text=s
    for row in rows:
        cells=t.add_row().cells
        for i,s in enumerate(row):cells[i].text=s
    for ri,row in enumerate(t.rows):
        for i,c in enumerate(row.cells):
            c.width=Inches(widths[i]);c.vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER
            pr=c._tc.get_or_add_tcPr();b=OxmlElement('w:tcBorders')
            for edge in ['top','left','bottom','right']:
                x=OxmlElement('w:'+edge);x.set(qn('w:val'),'single');x.set(qn('w:sz'),'4');x.set(qn('w:color'),'D9D9D9');b.append(x)
            pr.append(b);shade=OxmlElement('w:shd');shade.set(qn('w:fill'),'153B50' if ri==0 else ('F1F5F7' if ri%2==0 else 'FFFFFF'));pr.append(shade)
            margins=OxmlElement('w:tcMar')
            for edge in ['top','left','bottom','right']:
                x=OxmlElement('w:'+edge);x.set(qn('w:w'),'100');x.set(qn('w:type'),'dxa');margins.append(x)
            pr.append(margins)
            for para in c.paragraphs:
                para.paragraph_format.space_after=Pt(3);para.paragraph_format.space_before=Pt(3)
                for run in para.runs:
                    run.font.size=Pt(9.5)
                    if ri==0:run.bold=True;run.font.color.rgb=RGBColor(255,255,255)
        cant=OxmlElement('w:cantSplit');row._tr.get_or_add_trPr().append(cant)
    repeat=OxmlElement('w:tblHeader');t.rows[0]._tr.get_or_add_trPr().append(repeat)
    p('')

p('Dados NASA na Vila Artemis','Title')
p('Relatório de integração científica e revisão do protótipo','Subtitle')
p('Equipe Vila Artemis | Axl Seabra | 15 de novembro de 2026')
p('O protótipo passa a usar registros reais da NASA para ensinar decisões de exploração lunar. O gelo do tabuleiro deriva de uma ilustração M³; a exposição da equipe usa amostras de um modelo publicado; eventos históricos DONKI e medições RadLab permanecem acessíveis sem internet. A arte pixel v3 foi preservada.')
p('O principal limite é cartográfico: a vila é uma maquete educativa. Ela não localiza reservas para escavação nem certifica regiões seguras. Custos, produção e ciclos acelerados são regras do jogo, identificadas como simplificações.')
h('Dados incorporados')
table(['Fonte','Recorte utilizado','Aplicação'],[
('M³ NASA e Chandrayaan 1 ISRO','Mapa de gelo divulgado em 2018, cópia USGS','Oito pontos com marcas azuis geram depósitos e marcadores do atlas.'),
('NTRS e LOLA','Phipps et al. 2024, Figura 3','Três amostras de exposição relativa afetam astronautas em tempestades de treino.'),
('CCMC DONKI','33 notificações de 10 a 12 de maio de 2024','Arquivo offline; eventos SEP fundamentam replays. Consulta online opcional.'),
('OSDR RadLab','16 leituras DosTel de 1 de abril de 2022','Painel de medições reais da ISS em µGy/h, sem extrapolação lunar.'),
('NASA e CSA','Água, comunicação e cultivo','Perguntas, explicações e relações entre recursos.')],[1.35,2.1,3.3])
p('Não é necessário inserir a chave pessoal da NASA. O cliente usa o endpoint público CCMC por padrão. A chave literal foi removida do código e o exemplo de ambiente não contém credenciais.')

page();h('Como os dados mudam o jogo')
sub('Gelo observado')
p('O processamento identifica pixels azulados da figura M³ e seleciona oito células separadas fora da base inicial. As posições são convertidas para a grade de 28 por 28 do jogo. Cada depósito mantém o identificador e o pixel da imagem original. A quantidade coletável de 450 unidades é uma escolha de balanceamento, sem equivalência com litros ou concentração.')
p('O extrator precisa estar a até três células de um depósito e consome energia. A coleta esgota o depósito. A fonte confirma gelo superficial em partes dos polos, não poços de água líquida nem gelo garantido em toda cratera.')
sub('Exposição modelada')
p('A Figura 3 de Phipps et al. usa relevo LOLA para um cenário extremo de partículas solares de outubro de 1989. Três cores foram aproximadas pela legenda, arredondadas a 100 cGy e normalizadas pela escala de 4800 cGy. Os fatores resultantes são 0,625, 0,917 e 0,979. São valores de uma figura de modelo, não de um dosímetro atual.')
p('O jogador escolhe uma exposição representativa e paga 15 de energia e 10 de regolito pelo planejamento. O fator afeta a equipe fora do abrigo durante a tempestade. Nenhuma região é apresentada como segura. Não há sobreposição entre esse mapa e o mapa de gelo, pois não houve registro geográfico conjunto.')
sub('Eventos e leituras históricas')
p('DONKI conserva IDs, datas e links. O modo sala de aula usa um arquivo fixo para dar condições iguais à turma. Erro de rede não vira alerta inventado. O RadLab preserva instrumento, instante, unidade e ambiente. O gráfico exibe DosTel1 separadamente de DosTel2; uma leitura da ISS não determina dose lunar.')
sub('Restrições da vida real')
p('A noite zera a geração solar. Sem energia suficiente, a estufa e outros consumidores reduzem produção. Abrigar astronautas interrompe sua coleta. O rádio tem espera de ida e volta de 2,6 segundos na Lua. A espera marciana é reduzida para 24 segundos de treino e a faixa real é explicada. A troca de itens não representa a duração de um voo de suprimentos.')

page();h('Dados avaliados e descartados')
table(['Fonte ou hipótese','Decisão','Motivo'],[
('Mars Trek','Adiado','É cartografia de Marte. Não serve para localizar gelo ou radiação no polo lunar.'),
('Moon Trek WAC','Metadados arquivados','Sem escala radiométrica validada, não transformamos cores em percentuais de iluminação.'),
('RadLab como mapa lunar','Descartado','Instrumento, órbita e blindagem da ISS diferem do solo da Lua.'),
('DONKI RBE e GST como dose lunar','Descartado','Eventos ligados ao ambiente terrestre não são medições locais da Lua.'),
('APOD e fotos de rovers','Fora do recorte','Imagens ilustrativas não fornecem reservas lunares ou dose por local.'),
('nasa/api-docs','Referência de acesso','Documentação de APIs, não um conjunto de medições.'),
('bruffridge/nasawds','Sem adoção visual','Sistema de interface, não dado científico. A prioridade é preservar a arte v3.'),
('OSDR biológico geral','Sem extrapolação clínica','Não foram derivados danos médicos de estudos heterogêneos.'),
('Rendimentos de cultivo','Não inventados como NASA','CSA fundamenta o ensino. A produção por segundo é balanceamento do jogo.')],[1.8,1.6,3.35])
sub('Correções de conteúdo')
p('O marco de recuperação de 98% foi corrigido para água. Foram retiradas as afirmações de idade garantida do gelo em Shackleton e de aviso DONKI sempre com horas de antecedência. Tempestades de vento ficaram restritas a Marte. Bateria é reserva de energia; não permite que um painel gere no escuro. Kilopower é apresentado como fissão, e não como reator solar.')
p('O banco passou a 12 perguntas em português, inglês e espanhol. Também foi corrigida a seleção que repetia apenas parte das perguntas. Os índices de radiação e saúde de 0 a 100 continuam didáticos e não representam dose biológica acumulada.')

page();h('Conferência com o desafio oficial')
p('O desafio de 2026 pede um protótipo interativo para 7 a 12 anos. A faixa do projeto, 7 a 13, inclui esse público. O núcleo é ensinar consequências de escolhas sobre recursos, proteção e comunicação, com fontes atribuídas e dados reais ao vivo ou arquivados. Não exige um jogo completo.')
table(['Aspecto','Evidência no protótipo','Situação'],[
('Suporte à vida e alimentos','Consumo da equipe, produção de estufa e dependência energética','Implementado'),
('Energia e noite','Geração solar variável, reservas e redução de produção','Implementado'),
('Proteção e custo','Abrigo pausa coleta; cenário de exposição exige recursos','Implementado'),
('Comunicação','Espera de rádio e explicação sobre distância','Implementado'),
('NASA rastreável','Atlas, IDs DONKI, RadLab, manifestos e hashes','Implementado'),
('Acesso simples','Navegador, interface v3, dados e fontes locais','Implementado'),
('Tutorial definitivo','Onboarding básico; roteiro do proprietário ainda não recebido','Próxima etapa'),
('Teste com crianças e vídeo','Nenhuma sessão com crianças ou gravação foi produzida','Pendente')],[1.6,3.65,1.5])
p('Avaliação: a versão demonstra o núcleo científico e as decisões solicitadas. Isso não equivale a aprovação oficial da NASA ou garantia de classificação. O roteiro final e o playtest infantil são necessários para avaliar compreensão, duração e clareza da apresentação.')
sub('Verificação técnica')
p('Os testes de simulação cobrem proveniência, importação de dados, cache, ausência de rede, energia, exposição, rádio, repetibilidade e 12 perguntas. O build verifica TypeScript e gera os arquivos de produção. Os testes E2E exercitam desktop e celular de 390 por 844, modais, idiomas, ausência de overflow e recarga offline.')
validation=root/'artifacts/validation-summary.txt'
p(validation.read_text(encoding='utf-8') if validation.exists() else 'Resultados finais de execução estão registrados na entrega técnica do projeto.')

page();h('Fontes e reprodução')
p('Fontes consultadas em 15 de novembro de 2026. Os links abaixo abrem os documentos e portais originais. Arquivos recebidos, hashes e parâmetros estão no projeto em data/raw, data/derived e public/data.')
for label,url in [
('Desafio oficial Junior Astronaut Mission Trainer 2026','https://www.spaceappschallenge.org/2026/challenges/junior-astronaut-mission-trainer/?tab=details'),
('NASA JPL 2018 sobre gelo nos polos e instrumento M³','https://www.jpl.nasa.gov/news/ice-confirmed-at-the-moons-poles/'),
('USGS com o mapa original de gelo creditado à NASA','https://www.usgs.gov/media/images/moons-south-pole-image-water-icepng'),
('NASA NTRS 20240004047 com o modelo de radiação','https://ntrs.nasa.gov/citations/20240004047'),
('NASA CCMC DONKI e documentação da API','https://ccmc.gsfc.nasa.gov/tools/DONKI/'),
('NASA OSDR RadLab com campos e unidades da API','https://visualization.osdr.nasa.gov/radlab/gui/data-api/'),
('NASA 2023 sobre o marco de recuperação de água','https://www.nasa.gov/missions/station/iss-research/nasa-achieves-water-recovery-milestone-on-international-space-station/'),
('NASA SCaN sobre atrasos de comunicação','https://www.nasa.gov/missions/tech-demonstration/space-communications-7-things-you-need-to-know/'),
('NASA NTRS sobre latência Terra Lua','https://ntrs.nasa.gov/citations/20240007214'),
('CSA sobre produção de alimentos na Lua','https://www.asc-csa.gc.ca/eng/youth-educators/toolkits/food-production/'),
('NASA sobre demonstração de fissão Kilopower','https://www.nasa.gov/news-release/demonstration-proves-nuclear-fission-system-can-provide-space-exploration-power/'),
('NASA Mars Trek','https://trek.nasa.gov/mars/'),
('NASA documentação de APIs','https://github.com/nasa/api-docs'),
('NASAWDS avaliado como referência visual','https://github.com/bruffridge/nasawds')]: link(label,url)
sub('Reprodução e ressalvas de aquisição')
p('scripts/prepare-science.py reproduz a seleção de pixels, a leitura de legenda, a normalização dos registros e os hashes. As consultas DONKI e RadLab foram arquivadas. Neste ambiente, falhas de certificado exigiram uma exceção TLS nos downloads públicos sem credenciais. As páginas oficiais foram consultadas separadamente; recomenda-se repetir a aquisição com validação TLS normal para auditoria formal. Hashes comprovam identidade de bytes, não autenticidade por si sós.')
p('A publicação na Vercel e a assinatura para Play Store não foram realizadas. A chave pessoal não deve ser distribuída. O uso de dados públicos NASA não implica endosso da agência ao jogo.')
assert all('\u2014' not in para.text for para in doc.paragraphs)
path=root/'docs/Relatorio_Dados_NASA_Vila_Artemis.docx'
doc.save(path)
print(path)
