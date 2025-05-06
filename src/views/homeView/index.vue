<template>
    <div class="home-container">
      
      <!-- 主视觉区 -->
      <section class="hero">
        <div class="hero-overlay">
          <div class="hero-text">
            <h1>时崎狂三</h1>
            <p>追寻时间的脚步，掌控命运的轮回</p>
            <router-link to="/overview" class="btn">角色概览</router-link>
          </div>
         
        </div>
      </section>
  
  
    </div>
  </template>
  
  <script lang="ts" setup>
 
  </script>
  
  <style lang="scss" scoped>
  .home-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    color: #fde8e8;
    background-color: #1b1b1b;
    min-height: 100vh;
  
    .hero {
      width: 100%;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle at center, #3e1a1a, #0d0d0d);
      position: relative;
      overflow: hidden;
  
      .hero-overlay {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 80%;
        max-width: 1200px;
  
        .hero-text {
          max-width: 50%;
          opacity: 0;
          transform: translateX(-20px);
          animation: fadeInRight 1s 0.5s forwards;
  
          h1 {
            font-family: 'Cinzel Decorative', serif;
            font-size: 4rem;
            margin: 0;
            color: #e8bebe;
            text-shadow: 2px 2px 8px rgba(0,0,0,0.7);
          }
  
          p {
            font-size: 1.25rem;
            margin: 16px 0;
            font-style: italic;
            color: #f8dcdc;
          }
  
          .btn {
            display: inline-block;
            padding: 10px 30px;
            font-family: 'Cinzel Sans', sans-serif;
            font-size: 1rem;
            background: transparent;
            border: 2px solid #d14b4b;
            border-radius: 50px;
            text-decoration: none;
            color: #d14b4b;
            transition: background 0.3s, color 0.3s;
  
            &:hover {
              background: #d14b4b;
              color: #1b1b1b;
            }
          }
        }
  
       
      }
    }
    @keyframes fadeInRight {
      from { opacity: 0; transform: translateX(-20px); }
      to { opacity: 1; transform: translateX(0); }
    }
  
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  
    
  }
  </style>
  