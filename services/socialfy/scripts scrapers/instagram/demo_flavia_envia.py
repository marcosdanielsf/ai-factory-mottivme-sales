import asyncio
import os
from playwright.async_api import async_playwright

# Carrega session do ambiente (definido em ~/.env)
INSTAGRAM_SESSION = os.environ.get('INSTAGRAM_SESSION_ID')
if not INSTAGRAM_SESSION:
    print("❌ ERRO: INSTAGRAM_SESSION_ID não definida!")
    print("Execute: source ~/.env")
    exit(1)

async def demo_flavia():
    print("🚀 SOCIALFY AI - ENVIANDO MENSAGENS")

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False, slow_mo=200)

        context = await browser.new_context(viewport={'width': 1280, 'height': 900})

        await context.add_cookies([{
            'name': 'sessionid',
            'value': INSTAGRAM_SESSION,
            'domain': '.instagram.com',
            'path': '/'
        }])
        
        page = await context.new_page()
        
        perfis = [
            ('flavialealbeauty', 'Oi Flavia! 👋 To na call com você AGORA e nem mexi as mãos! Isso é IA em ação! 🚀'),
            ('flavialealbeautyschool', 'Oi Beauty School! 💄 Imagina a IA abordando cada lead automaticamente! ✨'),
            ('canaanranchofficial', 'Oi Canaan Ranch! 🌾 Do agro ao digital - IA prospectando! 🤠'),
        ]
        
        for username, msg in perfis:
            print(f"\n{'='*50}")
            print(f"🔍 Acessando @{username}...")
            await page.goto(f'https://www.instagram.com/{username}/')
            await asyncio.sleep(3)
            
            # Clica em Message
            print("📤 Abrindo chat...")
            try:
                msg_btn = page.locator('div[role="button"]').filter(has_text="Message")
                await msg_btn.first.click(timeout=5000)
            except:
                try:
                    await page.click('text=Message', timeout=3000)
                except:
                    await page.click('text=Enviar mensagem', timeout=3000)
            
            await asyncio.sleep(3)
            
            # Encontra e clica no campo de texto
            print("💬 Digitando mensagem...")
            try:
                # Tenta encontrar o campo de texto
                textarea = page.locator('div[role="textbox"], textarea[placeholder*="Message"], div[contenteditable="true"]').first
                await textarea.click()
                await asyncio.sleep(0.5)
                
                # Digita a mensagem
                await textarea.type(msg, delay=20)
                await asyncio.sleep(1)
                
                # ENVIA - clica no botão Send ou pressiona Enter
                print("✅ ENVIANDO...")
                try:
                    send_btn = page.locator('div[role="button"]').filter(has_text="Send")
                    await send_btn.first.click(timeout=2000)
                except:
                    await page.keyboard.press('Enter')
                
                await asyncio.sleep(2)
                print(f"🎉 MENSAGEM ENVIADA para @{username}!")
                
            except Exception as e:
                print(f"❌ Erro: {e}")
            
            # Volta pro perfil
            await asyncio.sleep(2)
        
        print(f"\n{'='*50}")
        print("🎉 TODAS AS MENSAGENS ENVIADAS!")
        print("⏳ Navegador aberto por 60s...")
        await asyncio.sleep(60)
        await browser.close()

asyncio.run(demo_flavia())
