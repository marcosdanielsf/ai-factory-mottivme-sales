import instaloader

# Configuração do Instaloader
L = instaloader.Instaloader(
    download_videos=True,
    download_video_thumbnails=True,
    download_geotags=False,
    download_comments=False,
    save_metadata=True,
    compress_json=False,
    post_metadata_txt_pattern='{caption}'
)

# Lista de perfis que você quer baixar
perfis = [
    "marcosdanielsf",
    # Adicione mais perfis aqui
    # "outro_perfil",
    # "mais_um_perfil",
]

# Quantidade de posts a baixar (deixe None para baixar todos)
max_posts = 10  # Mude para None se quiser todos os posts

for username in perfis:
    try:
        print(f"\n🔄 Baixando perfil: {username}")

        # Carrega o perfil
        profile = instaloader.Profile.from_username(L.context, username)

        # Exibe informações do perfil
        print(f"📛 Nome: {profile.full_name}")
        print(f"👥 Seguidores: {profile.followers}")
        print(f"📸 Total de posts: {profile.mediacount}")

        # Baixa os posts
        posts_baixados = 0
        for post in profile.get_posts():
            if max_posts and posts_baixados >= max_posts:
                break

            L.download_post(post, target=f"{username}")
            posts_baixados += 1
            print(f"  ✓ Post {posts_baixados} baixado")

        print(f"✅ Concluído: {username} ({posts_baixados} posts)")

    except Exception as e:
        print(f"❌ Erro ao baixar {username}: {e}")

print("\n🎉 Processo finalizado!")
