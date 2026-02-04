import instaloader

L = instaloader.Instaloader()

# Hashtag para buscar
hashtag = "vendas"  # Mude para a hashtag que quiser
max_posts = 20  # Quantidade de posts a baixar

try:
    print(f"🔍 Buscando posts da hashtag: #{hashtag}")

    posts_baixados = 0
    for post in instaloader.Hashtag.from_name(L.context, hashtag).get_posts():
        if posts_baixados >= max_posts:
            break

        L.download_post(post, target=f"hashtag_{hashtag}")
        posts_baixados += 1
        print(f"  ✓ Post {posts_baixados}/{max_posts} baixado")

    print(f"\n✅ {posts_baixados} posts da #{hashtag} baixados!")

except Exception as e:
    print(f"❌ Erro: {e}")
