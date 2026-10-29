import articleCatalog from "./articles.json";
import type { Degree, Demo, Role } from "./portfolio";

/**
 * Versão em português do conteúdo público. Mesmos fatos de content/portfolio.ts (que segue PUBLIC_FACTS.md):
 * só a língua muda. Nomes de repositórios, tecnologias e links não são traduzidos.
 */

export const profile = {
  summary:
    "Construo plataformas de dados e sistemas de IA que as equipes conseguem inspecionar, reproduzir e operar: lakehouses, pipelines de ML, sistemas de recuperação e os modelos por trás deles.",
  role: "Especialista em IA",
};

export const stats = [
  { value: "20", label: "anos em tecnologia, 12 deles só com inteligência artificial" },
  { value: "150+", label: "projetos entregues" },
  { value: String(articleCatalog.length), label: "artigos técnicos e de pesquisa publicados" },
  { value: "20+", label: "empresas atendidas" },
] as const;

export const tracks = ["Plataformas de dados", "Sistemas de ML", "IA generativa e recuperação", "Execução e entrega"];

export type ProjectPt = {
  slug: string;
  title: string;
  track: string;
  summary: string;
  evidence?: string;
  limits?: string;
  stack: string[];
  demo?: string;
  links?: { label: string; href: string }[];
};

export const demos: Pick<Demo, "id" | "area" | "title" | "summary" | "cta">[] = [
  {
    id: "rag-chat",
    area: "IA generativa · RAG",
    title: "Chat RAG",
    summary:
      "Um modelo de linguagem próprio, sem camada de recusa, apoiado em bases de conhecimento: busca editais, contratos e gastos com educação, escreve SQL somente leitura quando a resposta é um número, cita cada registro e mantém o fio da conversa.",
    cta: "Abrir o chat",
  },
  {
    id: "pncp",
    area: "Busca vetorial · Recuperação semântica",
    title: "Explorador de compras públicas",
    summary:
      "1,25 milhão de editais de compras públicas com embeddings de um modelo próprio, indexados no pgvector: compare a busca por palavras com a busca por significado, lado a lado, junto do painel agregado.",
    cta: "Buscar editais",
  },
  {
    id: "siope",
    area: "BI · Análise",
    title: "Gastos com educação",
    summary:
      "Um painel analítico dos gastos municipais com educação: investimento por aluno por ano, região e estado, sobre tabelas semânticas modeladas.",
    cta: "Abrir o painel",
  },
  {
    id: "datamap",
    area: "Data lake · Catálogo · Governança",
    title: "Mapa de dados",
    summary:
      "O catálogo de um data lake público: 428 tabelas e 33.891 colunas, das camadas brutas às analíticas, com fonte, linhagem, chaves de junção e as regras de privacidade aplicadas, pesquisável no navegador.",
    cta: "Explorar o mapa",
  },
];

export const projects: ProjectPt[] = [
  {
    slug: "brazil-public-data-map",
    title: "Mapa de dados públicos do Brasil",
    track: "Plataformas de dados",
    summary:
      "Onze fontes públicas brasileiras, do censo escolar às compras públicas, publicadas em camadas bruta, confiável e analítica, com contratos, um filtro de privacidade e hash por arquivo.",
    evidence:
      "31 conjuntos de dados no Kaggle, 428 tabelas e cerca de 4 bilhões de linhas em Parquet. Cada arquivo consta de um manifesto SHA-256, e um download limpo é conferido contra ele.",
    stack: ["BigQuery", "Parquet", "Python", "Kaggle API"],
    demo: "datamap",
    links: [{ label: "Conjuntos de dados no Kaggle", href: "https://www.kaggle.com/lucasrangelss/datasets" }],
  },
  {
    slug: "cloud-data-finops-sdd-toolkit",
    title: "Kit de FinOps de dados",
    track: "Plataformas de dados",
    summary: "Uma avaliação de custo guiada por especificação, que transforma um acesso estreito a metadados em achados auditáveis, um relatório e uma apresentação.",
    stack: ["Python", "BigQuery", "AWS", "SDD"],
  },
  {
    slug: "education-finance-mlops",
    title: "MLOps de finanças da educação",
    track: "Sistemas de ML",
    summary: "Triagem de anomalias por município nos gastos públicos com educação, com linhagem e uma trava de deriva que se recusa a pontuar uma carga de dados que mudou.",
    evidence:
      "A v0.2.0 pontuou a carga de 2022 com 96 sinais de revisão; a trava de deriva bloqueou a carga de 2023 com razão de dispersão de 1,384.",
    limits: "As saídas são sinais para revisão. Não há rótulos, então nenhuma acurácia é afirmada.",
    stack: ["Python", "scikit-learn", "MLflow"],
  },
  {
    slug: "pncp-opportunity-recommender",
    title: "Ranqueamento de compras públicas",
    track: "Sistemas de ML",
    summary: "Recuperação e ranqueamento transparentes de editais históricos, com cada pontuação explicada.",
    evidence: "A v0.2.0 ranqueia editais a partir da versão fixa do PNCP e confere o hash antes de usar.",
    limits: "A avaliação offline usa perfis sintéticos, então mede o respeito às restrições, não a relevância para o usuário.",
    stack: ["Python", "BM25", "Avaliação"],
  },
  {
    slug: "rag-chat",
    title: "Chat RAG",
    track: "IA generativa e recuperação",
    summary:
      "Um chat de pesquisa com citações sobre três bases públicas: recuperação por texto e vetor para editais, SQL somente leitura para contratos e gastos, e travas que rodam antes de qualquer chamada ao modelo.",
    evidence: "1.250.335 embeddings de editais no pgvector. A sessão de 01/10/2026 respondeu 10 de 10 perguntas roteirizadas.",
    limits: "Perguntas numéricas que cruzam todas as bases ainda podem cair na recuperação por texto; um roteador de perguntas está em andamento.",
    stack: ["Next.js", "FastAPI", "Postgres", "pgvector"],
    demo: "rag-chat",
  },
  {
    slug: "qwen-abliterated-api",
    title: "Serviço de LLM próprio",
    track: "IA generativa e recuperação",
    summary: "O modelo Qwen de 27B por trás do chat, servido de uma única GPU alugada por uma API compatível com a da OpenAI.",
    evidence: "Pesos NVFP4 no vLLM com decodificação especulativa: de 4,4 para cerca de 34 tokens por segundo na mesma GPU.",
    limits: "O checkpoint abliterado é um lançamento de terceiros; eu não o retreinei.",
    stack: ["vLLM", "Terraform", "GitHub Actions"],
  },
  {
    slug: "ai-platform-rag-observability",
    title: "RAG observável",
    track: "IA generativa e recuperação",
    summary: "Uma referência de recuperação com avaliação, citação das fontes e rastros com dados ocultados.",
    stack: ["Python", "Langfuse", "Docker"],
  },
  {
    slug: "distributed-agent-runtime-lab",
    title: "Runtime distribuído de agentes",
    track: "Execução e entrega",
    summary: "Workers coordenados por Redis com requisições idempotentes, manifestos de Kubernetes, Terraform e testes de recuperação.",
    evidence: "48 requisições com concorrência 6: 61,89 req/s, p95 de 147,95 ms. Recuperação de worker provada em um cluster kind local.",
    limits: "Modelo simulado determinístico em uma máquina; não é afirmação de capacidade. Nuvem não validada.",
    stack: ["Redis", "Kubernetes", "Helm", "Terraform"],
  },
];

type RolePt = Pick<Role, "company" | "summary" | "results" | "area" | "sector" | "highlights">;

/** Textos de cada empregador, na mesma ordem de `career` em portfolio.ts (do mais recente ao mais antigo). */
export const careerText: RolePt[] = [
  {
    company: "Drogasil",
    summary:
      "Engenharia de dados e IA para uma das maiores redes de farmácias do Brasil: pipelines, modelos e agentes de IA entregues em um só fluxo de engenharia, com governança e qualidade de dados embutidas.",
    results: ["Pipelines, modelos e agentes de IA evoluindo juntos em um fluxo de engenharia integrado.", "Mais governança, catalogação e monitoramento da qualidade dos dados."],
    area: "Engenharia de dados e IA",
    sector: "Varejo",
    highlights: [
      "Pipelines ELT com dbt e PySpark e dados preparados para aplicações de IA.",
      "Golden ID, deduplicação, governança e catalogação assistida por IA.",
      "Soluções com LLM, RAG e bancos vetoriais, com CI/CD no GitLab para dados, modelos e agentes.",
    ],
  },
  {
    company: "Bradesco",
    summary:
      "Engenharia de dados e machine learning em Databricks para um dos maiores bancos do Brasil, mantendo os pipelines de processamento e de ML em funcionamento e versionados.",
    results: ["Pipelines de processamento de dados e de ML sustentados em Databricks.", "Ativos de dados e de modelos organizados e versionados com as ferramentas de lakehouse."],
    area: "Engenharia de dados e ML",
    sector: "Bancos",
    highlights: [
      "Fluxos ETL/ELT e pipelines de ML em Databricks.",
      "Jobs, clusters e modelos monitorados com MLflow.",
      "Dados e modelos versionados com Delta Lake, Unity Catalog e Feature Store.",
    ],
  },
  {
    company: "SCPC",
    summary:
      "Pipelines de dados e de ML no Google Cloud para uma empresa de análise de crédito, da orquestração com Composer e do processamento em Dataproc aos modelos no Vertex AI.",
    results: ["Pipelines de dados e de ML integrados aos principais serviços do GCP.", "Ciclos de desenvolvimento e entrega automatizados com CI/CD."],
    area: "Engenharia de dados e ML",
    sector: "Análise de crédito",
    highlights: [
      "Pipelines de dados e de ML no Google Cloud com Composer e Dataproc.",
      "Pipelines em Java, Python, Spark e Vertex AI.",
      "CI/CD no GitLab sobre BigQuery, Bigtable, Dataflow e Cloud Storage.",
    ],
  },
  {
    company: "Cielo",
    summary:
      "Engenharia de big data para uma empresa de meios de pagamento: um cluster Cloudera alimentado a partir do Oracle, modelagem de data warehouse e serviços da AWS ao lado.",
    results: ["Dados relacionais integrados ao ecossistema de big data Cloudera.", "Pipelines evoluídos com processamento em Spark e serviços de dados da AWS."],
    area: "Engenharia de dados e big data",
    sector: "Pagamentos",
    highlights: [
      "Rotinas Cloudera com Hadoop, Hive e Spark; extração do Oracle com Sqoop.",
      "Modelagem de data warehouse.",
      "AWS S3, Glue, Athena e SageMaker ao lado do cluster local.",
    ],
  },
  {
    company: "Drogaria São Paulo",
    summary:
      "Construção de um data lake no Google Cloud para uma rede de farmácias, levando extrações QVD do Qlik para o Cloud Storage, o Composer e o BigQuery.",
    results: ["Uma arquitetura de data lake no Google Cloud.", "Dados QVD integrados ao Cloud Storage, ao Composer e ao BigQuery."],
    area: "Engenharia de dados",
    sector: "Varejo",
    highlights: ["Construção de um data lake no Google Cloud a partir de extrações QVD do Qlik.", "Orquestração com Composer/Airflow sobre Cloud Storage e BigQuery."],
  },
  {
    company: "Sem Parar",
    summary:
      "Engenharia de dados para uma empresa de pagamentos de mobilidade: bancos relacionais migrados para um data lake na AWS, com Salesforce e CRM integrados.",
    results: ["Bancos relacionais migrados para um data lake na nuvem.", "Fontes corporativas e sistemas de CRM integrados aos processos de dados."],
    area: "Engenharia de dados",
    sector: "Pagamentos de mobilidade",
    highlights: ["Migração de bancos relacionais para um data lake na AWS.", "Fluxos SSIS sobre SQL Server e Oracle; integração com Salesforce e CRM."],
  },
  {
    company: "Smarttbot",
    summary:
      "Trabalho full-stack e em nuvem para uma fintech: backends em Python e Node.js, frontends em React, Redis e MySQL, tudo em contêineres na AWS.",
    results: ["Aplicações full-stack entregues e mantidas no ar na AWS.", "Um ambiente de execução padronizado com Docker."],
    area: "Full-stack e nuvem",
    sector: "Fintech",
    highlights: ["Backends em Python e Node.js, frontends em React, Redis e MySQL, tudo em contêineres na AWS."],
  },
  {
    company: "Cogna Educação",
    summary:
      "Engenharia de dados e coordenação de projetos para o maior grupo de educação do Brasil: fontes SAP HANA e MongoDB, Spark, Airflow e um data warehouse.",
    results: ["Pipelines e integrações de dados evoluídos em ambientes de big data e de nuvem.", "Mais governança de dados e coordenação das iniciativas técnicas."],
    area: "Engenharia de dados e coordenação de projetos",
    sector: "Educação",
    highlights: [
      "Extração de SAP HANA e MongoDB, rotinas em Spark e modelagem de data warehouse.",
      "Pipelines com Azure DevOps, Spark e Airflow; governança de dados e coordenação de projetos.",
    ],
  },
  {
    company: "TOTVS",
    summary: "Trabalho com software e bancos de dados na maior empresa de software de gestão do Brasil: desenvolvimento em Delphi e administração de Oracle.",
    results: ["Demandas de desenvolvimento entregues na plataforma Delphi.", "Infraestrutura Oracle e rotinas PL/SQL mantidas em funcionamento."],
    area: "Software e bancos de dados",
    sector: "Software de gestão",
    highlights: ["Desenvolvimento em Delphi, administração de servidores Oracle e rotinas PL/SQL."],
  },
  {
    company: "SENAI ITA",
    summary:
      "Software para automação industrial no instituto de tecnologia do SENAI: C++ embarcado, aplicativos web e mobile, mensageria MQTT e cinco tecnologias de banco de dados.",
    results: ["Soluções multiplataforma para web, mobile e sistemas embarcados.", "Um conjunto diverso de tecnologias de banco de dados administrado."],
    area: "Software e bancos de dados",
    sector: "Automação industrial",
    highlights: ["Python, Java, C++ para chips embarcados, aplicativos web e mobile, mensageria MQTT e cinco tecnologias de banco de dados."],
  },
];

export const engagements: { sector: string; problem: string; stack: string[]; article?: string }[] = [
  { sector: "E-commerce de supermercado", problem: "Recomendação de produtos para um supermercado online europeu, escolhidos em duas etapas: primeiro a categoria, depois a marca e o tamanho da embalagem.", stack: ["AWS Glue", "SageMaker Pipelines", "DeepFM", "DIN", "Terraform"], article: "h4-two-stage-recommender-grocery" },
  { sector: "Entretenimento", problem: "Recomendação de produtos de bomboniere para clientes cadastrados e anônimos, com desenho de teste A/B e monitoramento em produção.", stack: ["Azure ML", "Microsoft Fabric", "Azure DevOps"], article: "h2-recommender-only-shows-best-sellers" },
  { sector: "Finanças", problem: "Um assistente multiagente cujos números vêm sempre de um lake bronze, prata e ouro, nunca do prompt.", stack: ["AWS Glue", "Athena", "SageMaker", "Agentes de LLM"], article: "h7-stop-agents-inventing-numbers" },
  { sector: "Mineração e materiais a granel", problem: "Volume de pilhas de estoque a partir de imagens de drone: fotogrametria, ajuste do solo e segmentação de nuvem de pontos em um job de contêiner.", stack: ["OpenDroneMap", "RANSAC", "HDBSCAN", "AWS Batch"], article: "h1-measure-stockpile-volume-drone-photos" },
  { sector: "Telecom", problem: "A carteira de serviços vai bater a meta de receita do mês? Probabilidades de ativação por pedido e agentes de IA que as explicam.", stack: ["Python", "Monte Carlo", "Agentes de LLM"], article: "h8-forecasting-with-ai-agents" },
  { sector: "Açúcar e etanol", problem: "Uma revisão semanal de preços em que quatro de cinco etapas viraram código simples sobre um lakehouse em camadas, e uma continuou sendo um LLM.", stack: ["BigQuery", "Dataform", "Terraform", "LangGraph"], article: "h9-only-one-agent-needs-an-llm" },
  { sector: "Fabricação de máquinas", problem: "Busca de peças intercambiáveis entre fábricas: extrair os atributos críticos, filtrar por eles e ranquear o que serve.", stack: ["NLP", "Busca", "LLM"], article: "h5-interchangeable-parts-ai-search" },
  { sector: "Acessibilidade em e-commerce", problem: "Varreduras diárias de acessibilidade, uma checagem em cada pull request e um agente de código que abre correções para revisão humana.", stack: ["Playwright", "axe-core", "AWS", "Agentes de código"], article: "h10-accessibility-fixes-with-ai-agents" },
  { sector: "Crédito", problem: "Um data lake e um motor de risco próprios para crédito a pequenas empresas, com uma probabilidade de inadimplência que os analistas conseguem ler.", stack: ["ClickHouse", "MinIO", "Airflow", "Metabase", "FastAPI"], article: "h14-predict-loan-default" },
  { sector: "Indústria têxtil", problem: "Um data lake na AWS e uma previsão semanal de demanda por família de produto e cor, para o planejamento da produção.", stack: ["AWS Glue", "Terraform", "Gradient boosting"], article: "h13-weekly-demand-forecasting" },
  { sector: "Educação", problem: "Data lakes de dados públicos e de produto para empresas de educação: zonas bruta, confiável e semântica, orquestração diária e BI.", stack: ["BigQuery", "Airflow", "Metabase", "Power BI"], article: "d1-cut-cloud-data-lake-costs" },
  { sector: "Modernização de legado", problem: "Um transpilador guiado por especificação que leva código COBOL, Delphi e SAS para Python e Databricks.", stack: ["LLM", "SDD", "Databricks"], article: "h12-migrating-legacy-code-spec-driven" },
];

export const education: Degree[] = [
  { level: "Graduação", title: "Engenharia Mecatrônica", school: "Instituto Federal de Goiás (IFG)", focus: "Eletrônica, sistemas de controle, programação embarcada e automação industrial: a base dos primeiros trabalhos em software embarcado e automação." },
  { level: "Tecnólogo", title: "Análise e Desenvolvimento de Sistemas", school: "Universidade Norte do Paraná (UNOPAR)", focus: "Engenharia de software, bancos de dados, análise de sistemas e desenvolvimento de aplicações." },
  { level: "Especialização", title: "Engenharia de Dados", school: "Universidade Norte do Paraná (UNOPAR)", focus: "Pipelines de dados, modelagem de dados, data warehouses e processamento de big data." },
  { level: "Especialização", title: "Machine Learning e Inteligência Artificial", school: "Centro Universitário UNYLEYA", focus: "Modelos de machine learning, sua avaliação e inteligência artificial aplicada." },
];

export const languages = [
  { name: "Português", level: "Nativo" },
  { name: "Inglês", level: "Intermediário" },
] as const;
