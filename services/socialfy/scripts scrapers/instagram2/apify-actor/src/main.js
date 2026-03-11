/**
 * MOTTIVME Instagram Followers Scraper v3
 *
 * Busca seguidores de um perfil e filtra por keywords (ex: médicos).
 * REQUER sessionId para acessar lista de seguidores.
 */

import { Actor, log } from 'apify';

await Actor.init();

const input = await Actor.getInput() ?? {};
const {
    targetUsername = null,      // Perfil alvo para buscar seguidores
    usernames = [],             // OU lista de usernames para buscar dados
    sessionId = null,           // Cookie de sessão do Instagram
    maxFollowers = 100,         // Máximo de seguidores para buscar
    filterKeywords = [],        // Keywords para filtrar (ex: ['dr.', 'médico', 'crm'])
    mode = 'auto'               // 'profiles' | 'followers' | 'auto'
} = input;

// Headers para parecer navegador real
const headers = {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    'X-IG-App-ID': '936619743392459',
    'X-Requested-With': 'XMLHttpRequest',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Dest': 'empty',
};

// Adicionar session se fornecido
if (sessionId) {
    headers['Cookie'] = `sessionid=${sessionId}`;
    log.info('Usando session ID fornecido');
}

const results = [];

// =============================================================================
// FUNÇÃO: Buscar dados de um perfil
// =============================================================================
async function fetchProfile(username) {
    const cleanUsername = username.replace('@', '').toLowerCase();

    try {
        log.info(`Buscando perfil: @${cleanUsername}`);

        const apiUrl = `https://i.instagram.com/api/v1/users/web_profile_info/?username=${cleanUsername}`;
        const response = await fetch(apiUrl, { headers });

        if (response.status === 200) {
            const data = await response.json();
            const user = data?.data?.user;

            if (user) {
                return {
                    userId: user.id,
                    username: user.username,
                    fullName: user.full_name,
                    biography: user.biography,
                    followersCount: user.edge_followed_by?.count,
                    followingCount: user.edge_follow?.count,
                    postsCount: user.edge_owner_to_timeline_media?.count,
                    isVerified: user.is_verified,
                    isPrivate: user.is_private,
                    isBusinessAccount: user.is_business_account,
                    profilePicUrl: user.profile_pic_url_hd || user.profile_pic_url,
                    externalUrl: user.external_url,
                    category: user.category_name,
                    url: `https://instagram.com/${cleanUsername}`,
                    scrapedAt: new Date().toISOString(),
                };
            }
        } else if (response.status === 401) {
            log.warning(`@${cleanUsername}: Login necessário (401)`);
            return { username: cleanUsername, error: 'Login necessário', needsAuth: true };
        } else {
            log.error(`@${cleanUsername}: HTTP ${response.status}`);
            return { username: cleanUsername, error: `HTTP ${response.status}` };
        }
    } catch (error) {
        log.error(`Erro @${cleanUsername}: ${error.message}`);
        return { username: cleanUsername, error: error.message };
    }

    return null;
}

// =============================================================================
// FUNÇÃO: Buscar seguidores de um perfil (API v1 mobile)
// =============================================================================
async function fetchFollowers(userId, username, maxCount = 100) {
    if (!sessionId) {
        log.error('sessionId é obrigatório para buscar seguidores');
        return [];
    }

    const followers = [];
    let maxId = null;
    let hasNext = true;

    log.info(`Buscando até ${maxCount} seguidores de @${username}...`);

    // Headers específicos para API mobile
    const mobileHeaders = {
        ...headers,
        'X-IG-App-ID': '936619743392459',
        'X-ASBD-ID': '129477',
        'X-IG-WWW-Claim': '0',
        'Origin': 'https://www.instagram.com',
        'Referer': `https://www.instagram.com/${username}/followers/`,
    };

    while (hasNext && followers.length < maxCount) {
        try {
            // Endpoint API v1 para seguidores
            let url = `https://i.instagram.com/api/v1/friendships/${userId}/followers/?count=50`;
            if (maxId) {
                url += `&max_id=${maxId}`;
            }

            log.info(`  Requisitando: ${url.substring(0, 80)}...`);

            const response = await fetch(url, { headers: mobileHeaders });
            const responseText = await response.text();

            if (response.status === 200) {
                let data;
                try {
                    data = JSON.parse(responseText);
                } catch (e) {
                    log.error(`Resposta não é JSON: ${responseText.substring(0, 200)}`);
                    hasNext = false;
                    continue;
                }

                const users = data.users || [];

                for (const user of users) {
                    followers.push({
                        userId: user.pk || user.id,
                        username: user.username,
                        fullName: user.full_name,
                        isPrivate: user.is_private,
                        isVerified: user.is_verified,
                        profilePicUrl: user.profile_pic_url,
                    });
                }

                log.info(`  Coletados ${followers.length}/${maxCount} seguidores...`);

                // Paginação
                hasNext = data.next_max_id && followers.length < maxCount;
                maxId = data.next_max_id;

                // Rate limiting
                await new Promise(r => setTimeout(r, 2000));

            } else if (response.status === 401) {
                log.error('Sessão expirada (401). Atualize o sessionId.');
                log.error(`Response: ${responseText.substring(0, 300)}`);
                hasNext = false;
            } else if (response.status === 400) {
                log.error(`Erro 400: ${responseText.substring(0, 300)}`);
                // Tentar endpoint alternativo
                hasNext = false;
            } else {
                log.error(`Erro HTTP ${response.status}: ${responseText.substring(0, 200)}`);
                hasNext = false;
            }

        } catch (error) {
            log.error(`Erro na paginação: ${error.message}`);
            hasNext = false;
        }
    }

    log.info(`Total coletado: ${followers.length} seguidores de @${username}`);
    return followers;
}

// =============================================================================
// FUNÇÃO: Filtrar por keywords
// =============================================================================
function matchesKeywords(follower, keywords) {
    if (!keywords || keywords.length === 0) return true;

    const text = `${follower.fullName || ''} ${follower.username || ''}`.toLowerCase();

    for (const keyword of keywords) {
        if (text.includes(keyword.toLowerCase())) {
            return true;
        }
    }

    return false;
}

// =============================================================================
// EXECUÇÃO PRINCIPAL
// =============================================================================

// Determinar modo de operação
let operationMode = mode;
if (mode === 'auto') {
    if (targetUsername) {
        operationMode = 'followers';
    } else if (usernames.length > 0) {
        operationMode = 'profiles';
    } else {
        log.error('Forneça targetUsername OU usernames[]');
        await Actor.exit();
    }
}

log.info(`Modo de operação: ${operationMode}`);

// =============================================================================
// MODO PROFILES: Buscar dados de perfis específicos
// =============================================================================
if (operationMode === 'profiles') {
    log.info(`Processando ${usernames.length} perfis`);

    for (const username of usernames) {
        const profile = await fetchProfile(username);
        if (profile) {
            results.push(profile);
        }
        await new Promise(r => setTimeout(r, 2000));
    }
}

// =============================================================================
// MODO FOLLOWERS: Buscar seguidores de um perfil alvo
// =============================================================================
if (operationMode === 'followers') {
    if (!sessionId) {
        log.error('Para buscar seguidores, forneça um sessionId válido!');
        log.info('Para obter o sessionId:');
        log.info('1. Faça login no Instagram pelo navegador');
        log.info('2. Abra DevTools (F12) > Application > Cookies');
        log.info('3. Copie o valor do cookie "sessionid"');
        await Actor.exit();
    }

    // Primeiro, buscar userId do perfil alvo
    const targetProfile = await fetchProfile(targetUsername);

    if (!targetProfile || targetProfile.error) {
        log.error(`Não foi possível acessar @${targetUsername}`);
        await Actor.exit();
    }

    if (targetProfile.isPrivate) {
        log.error(`@${targetUsername} é um perfil privado. Não é possível acessar seguidores.`);
        await Actor.exit();
    }

    log.info(`Perfil alvo: @${targetProfile.username} (${targetProfile.followersCount} seguidores)`);

    // Buscar seguidores
    const followers = await fetchFollowers(targetProfile.userId, targetProfile.username, maxFollowers);

    // Filtrar por keywords se fornecidas
    let filteredFollowers = followers;
    if (filterKeywords.length > 0) {
        log.info(`Filtrando por keywords: ${filterKeywords.join(', ')}`);
        filteredFollowers = followers.filter(f => matchesKeywords(f, filterKeywords));
        log.info(`${filteredFollowers.length} seguidores após filtro`);
    }

    // Para cada seguidor filtrado, buscar dados completos do perfil
    log.info(`Buscando dados completos de ${filteredFollowers.length} perfis...`);

    for (const follower of filteredFollowers) {
        // Pular perfis privados
        if (follower.isPrivate) {
            log.info(`  ⊘ @${follower.username}: perfil privado, pulando`);
            continue;
        }

        const profile = await fetchProfile(follower.username);
        if (profile && !profile.error) {
            profile.sourceAccount = targetUsername;
            results.push(profile);
            log.info(`  ✓ @${profile.username}: ${profile.followersCount} seguidores`);
        }

        await new Promise(r => setTimeout(r, 2000));
    }
}

// Salvar resultados
await Actor.pushData(results);
log.info(`Concluído: ${results.length} perfis processados`);
await Actor.exit();
