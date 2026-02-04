import asyncio
from playwright.async_api import async_playwright

async def demo_flavia():
    print("🚀 SOCIALFY AI - Demo Playwright Ao Vivo")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False, slow_mo=300)
        
        context = await browser.new_context(viewport={'width': 1280, 'height': 900})
        
        await context.add_cookies([{
            'name': 'sessionid',
            'value': '258328766:EKJ8m0QEivWYrN:26:AYhUMNhVmKHrhGMaUHaGq8g0VeaX8khoySa6eU2mfw',
            'domain': '.instagram.com',
            'path': '/'
        }])
        
        page = await context.new_page()
        
        perfis = [
            ('flavialealbeauty', 'Oi Flavia! 👋 To na call com você AGORA! 🚀'),
            ('flavialealbeautyschool', 'Oi Beauty School! 💄 IA abordando leads! ✨'),
            ('cenvia.group', 'Oi Cenvia! 🏢 Prospecção automática! 🚀'),
            ('canaanranchofficial', 'Oi Ranch! 🌾 Do agro ao digital! 🤠'),
        ]
        
        for username, msg in perfis:
            print(f"\n🔍 Acessando @{username}...")
            await page.goto(f'https://www.instagram.com/{username}/')
            await asyncio.sleep(3)
            
            # Pega info do perfil na tela
            try:
                name = await page.locator('header section h2, header h1').first.text_content()
                print(f"✅ Perfil: {name}")
            except:
                print(f"✅ Perfil: @{username}")
            
            print(f"💬 Mensagem: {msg}")
            
            # Clica em Message para mostrar
            try:
                await page.click('div[role="button"]:has-text("Message")', timeout=3000)
                await asyncio.sleep(2)
                
                # Digita a mensagem
                await page.keyboard.type(msg, delay=30)
                await asyncio.sleep(2)
                
                # Fecha o chat (ESC)
                await page.keyboard.press('Escape')
                await asyncio.sleep(1)
            except:
                print("   (Botão Message não encontrado)")
            
            await asyncio.sleep(2)
        
        print("\n🎉 DEMO COMPLETA - 4 perfis visitados!")
        print("⏳ Navegador aberto por 30s...")
        await asyncio.sleep(30)
        await browser.close()

asyncio.run(demo_flavia())
