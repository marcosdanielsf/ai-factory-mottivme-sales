import instaloader

L = instaloader.Instaloader()

username = "marcosdanielsf"

try:
    profile = instaloader.Profile.from_username(L.context, username)

    print(f"✅ Username: {profile.username}")
    print(f"📛 Nome: {profile.full_name}")
    print(f"📝 Bio: {profile.biography}")
    print(f"👥 Seguidores: {profile.followers}")
    print(f"👤 Seguindo: {profile.followees}")
    print(f"📸 Posts: {profile.mediacount}")
    print(f"🔗 Site: {profile.external_url}")
    print(f"✓ Verificado: {profile.is_verified}")
    print(f"💼 Business: {profile.is_business_account}")
    if profile.is_business_account:
        print(f"📁 Categoria: {profile.business_category_name}")

except Exception as e:
    print(f"❌ Erro: {e}")
