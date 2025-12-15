// ✅ 新的写法（替换）
// 把这个换成你第一步拿到的真实 Worker 地址
const API_URL = 'https://black-frog-0cbb.choooiox.workers.dev'; 

export async function getPosts() {
  try {
    // 直接请求你的 Worker 接口
    const res = await fetch(`${API_URL}/api/posts`);
    
    if (!res.ok) throw new Error('网络请求挂了');
    
    const data = await res.json();
    return data; // 这里拿到的就是文章列表数组
  } catch (err) {
    console.error('获取文章失败:', err);
    return [];
  }
}
