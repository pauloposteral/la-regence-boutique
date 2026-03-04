

## Plano: Importar dados reais da loja loja.cafelaregence.com.br

### Dados coletados do site original

Identifiquei **5 produtos de cafe** + **8 acessorios/kits** na loja WordPress atual. Os dados do banco atual contam com 6 produtos fictícios que precisam ser substituídos pelos reais.

### Inventario de produtos reais coletados

| Produto | Preco | Promo | SCA | Variedade | Processo | Origem | Altitude | Notas Sensoriais | Estoque |
|---------|-------|-------|-----|-----------|----------|--------|----------|-------------------|---------|
| Cafe LR Cacau 250g | R$39,90 | - | 88.5 | Catucai Vermelho | Natural | Campestre-MG | 1370m | Cacau, Frutas Vermelhas, Frutas Roxas | em estoque |
| Cafe LR MEL 500g | R$79,90 | R$69,90 | 87.5 | Catucai Amarelo | Natural | Campestre-MG | 1370m | Mel, Baunilha, Caramelo | fora estoque |
| Cafe LR Geisha 250g | R$59,90 | - | 89 | Geisha | - | Carmo de Minas | 1370m | Chocolate 70% | fora estoque |
| Cafe LR MOKA 500g | R$89,00 | - | - | Catucai Amarelo | Natural | Campestre-MG | 1370m | Mel, Baunilha, Caramelo | fora estoque |
| LR Drip Coffee CX 10 | R$59,90 | - | - | Catucai Amarelo | Natural | Sul de Minas | - | Mel, Baunilha, Caramelo | em estoque |

**Acessorios/Kits coletados:**
- Caneca Prata 380ml - R$58,90
- Caneca Bronze 380ml - R$58,90
- Caneca Preta 380ml - R$58,90
- Caneca Azul 380ml - R$58,90
- Caneca Branca 380ml - R$58,90
- Xicara e Pires Vermelha 80ml - R$54,90
- Cafeteira Bialetti Venus 4 xicaras - R$499,00
- Kit Cafe LR + Coador + Xicara - R$199,00

**Imagens coletadas (URLs diretas do WordPress):**
- Logo: `https://i0.wp.com/loja.cafelaregence.com.br/wp-content/uploads/2024/01/cropped-logo_site-1.png`
- LR Cacau principal: `https://i0.wp.com/loja.cafelaregence.com.br/wp-content/uploads/2024/02/CAFE-ESPECIAL-EM-GRAOS-scaled.jpg`
- LR Cacau extras: etiqueta, fazenda, graos (9 imagens)
- LR MEL principal: `https://i0.wp.com/loja.cafelaregence.com.br/wp-content/uploads/2024/02/6a3d5356-bba5-44d7-9230-0694b970cf14.jpeg`
- LR MEL extras: caracteristicas, cafeteira, fazenda (7 imagens)
- LR Geisha: `https://i0.wp.com/loja.cafelaregence.com.br/wp-content/uploads/2024/08/GEISHA-OURO-scaled.jpg`
- LR Drip Coffee: 3 imagens
- Canecas: 1 imagem cada
- Sobre nos: `https://i0.wp.com/loja.cafelaregence.com.br/wp-content/uploads/2024/02/lrcacau.jpeg`

**Texto "Sobre nos":**
> "A historia do Cafe La Regence comecou em 2006, na cidade de Andradina, interior de Sao Paulo, quando a familia Posteral, apaixonada por cafes, decidiu fundar uma cafeteria especializada em cafes especiais..."

**Depoimentos reais coletados:**
- Maycon Mazotti (Barista): "Cafe muito doce, acidez bem baixa, com corpo equilibrado..."
- Vitor Benhosi (Barista): "Um cafe equilibrado, com acidez e docura na medida certa..."
- Alba Lopes (Produtora): "Esta foi nossa melhor safra da historia..."
- Paulo Posteral (Mestre de Torras): "Estou ha quase 20 anos no mercado de cafes especiais..."

---

### O que sera feito

**1. Migrar produtos no banco de dados**
- Deletar os 6 produtos ficticios atuais (Alta Mogiana, Blend, Cerrado, Chapada, Mogiana, Sul de Minas) + suas variantes
- Inserir os 5 cafes reais com todas as especificacoes tecnicas coletadas
- Criar novas categorias: "Cafes Especiais", "Acessorios", "Kits"
- Inserir os 8 acessorios/kits
- Criar variantes de moagem para os cafes (Em Graos, Moagem Tradicional/Melita, Espresso, Grossa/Prensa, Media/Chemex)

**2. Inserir imagens reais na tabela `produto_imagens`**
- Linkar as URLs das imagens do WordPress diretamente (hotlinking das imagens hospedadas no wp-content)
- Definir imagem principal e secundarias para cada produto

**3. Atualizar textos e conteudo**
- Atualizar a pagina "Sobre Nos" com o texto real da familia Posteral
- Atualizar a secao de depoimentos (TestimonialsSection) com os reviews reais dos baristas e produtora
- Atualizar o HeroSection com a marca e identidade visual real
- Usar a logo real no Header

**4. Atualizar descricoes detalhadas**
- Cada produto tera a descricao completa coletada do site original incluindo informacoes do produtor, regiao, fazenda e perfil sensorial detalhado

### Consideracoes tecnicas

- As imagens serao referenciadas diretamente via URL do WordPress existente (nao sera feito download/upload para o storage). Isso funciona enquanto a loja WordPress estiver no ar. Se preferir, posso fazer upload para o storage do projeto, mas isso requer um passo adicional.
- Os moagens serao mapeados para o enum existente: `graos`, `fina`, `media`, `grossa`, `extra_fina`
- Os valores de corpo/acidez/docura/retrogosto serao estimados a partir dos perfis sensoriais descritos

