import instaloader

# ATENÇÃO: Para baixar stories você precisa estar logado!
L = instaloader.Instaloader()

# Descomente e configure seu login (necessário para stories)
# USERNAME = "seu_usuario"
# PASSWORD = "sua_senha"
# L.login(USERNAME, PASSWORD)

perfis = [
    "marcosdanielsf",
    # Adicione mais perfis aqui
]

for username in perfis:
    try:
        print(f"\n🔄 Baixando stories de: {username}")

        profile = instaloader.Profile.from_username(L.context, username)

        # Baixa stories (requer login)
        for story in L.get_stories(userids=[profile.userid]):
            print(f"  📱 Baixando stories de {story.owner_username}")
            for item in story.get_items():
                L.download_storyitem(item, target=f"{username}_stories")

        print(f"✅ Stories de {username} baixados!")

    except Exception as e:
        print(f"❌ Erro: {e}")
        print("💡 Dica: Stories requerem login. Descomente as linhas de login no código.")
