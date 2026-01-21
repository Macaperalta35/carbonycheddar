#!/usr/bin/env python
"""
Script para poblar la base de datos con datos de prueba
Incluye: ingredientes, recetas (hamburguesas, ensaladas, papas fritas) y usuarios
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app, db
from models import Usuario, Ingrediente, Receta, RecetaIngrediente

def seed_database():
    """Crea datos de prueba en la base de datos"""
    
    with app.app_context():
        # Limpiar tablas existentes
        print("Limpiando tablas...")
        db.drop_all()
        db.create_all()
        
        # 1. Crear usuarios
        print("Creando usuarios...")
        usuario = Usuario(
            nombre="Admin Test",
            email="admin@test.com",
            rol="admin"
        )
        usuario.set_password("admin123")
        db.session.add(usuario)
        db.session.commit()
        
        # 2. Crear ingredientes
        print("Creando ingredientes...")
        ingredientes_data = [
            # Carnes
            {"nombre": "Carne de res molida", "unidad_medida": "kg", "costo_unitario": 8.50, "descripcion": "Para hamburguesas"},
            {"nombre": "Pollo deshilachado", "unidad_medida": "kg", "costo_unitario": 6.00, "descripcion": "Para ensaladas"},
            
            # Vegetales
            {"nombre": "Lechuga", "unidad_medida": "kg", "costo_unitario": 2.00, "descripcion": "Lechuga fresca"},
            {"nombre": "Tomate", "unidad_medida": "kg", "costo_unitario": 2.50, "descripcion": "Tomates frescos"},
            {"nombre": "Cebolla", "unidad_medida": "kg", "costo_unitario": 1.50, "descripcion": "Cebolla blanca"},
            {"nombre": "Pepino", "unidad_medida": "kg", "costo_unitario": 1.80, "descripcion": "Pepinos frescos"},
            {"nombre": "Lechuga romana", "unidad_medida": "kg", "costo_unitario": 2.50, "descripcion": "Lechuga romana"},
            
            # Lácteos
            {"nombre": "Queso cheddar", "unidad_medida": "kg", "costo_unitario": 12.00, "descripcion": "Queso para hamburguesas"},
            {"nombre": "Queso fresco", "unidad_medida": "kg", "costo_unitario": 8.00, "descripcion": "Para ensaladas"},
            
            # Pan y harinas
            {"nombre": "Pan de hamburguesa", "unidad_medida": "unidad", "costo_unitario": 0.50, "descripcion": "Pan para hamburguesas"},
            {"nombre": "Papas", "unidad_medida": "kg", "costo_unitario": 1.20, "descripcion": "Papas para freír"},
            
            # Condimentos y salsas
            {"nombre": "Mayonesa", "unidad_medida": "l", "costo_unitario": 3.50, "descripcion": "Mayonesa comercial"},
            {"nombre": "Ketchup", "unidad_medida": "l", "costo_unitario": 2.50, "descripcion": "Ketchup"},
            {"nombre": "Mostaza", "unidad_medida": "l", "costo_unitario": 2.00, "descripcion": "Mostaza"},
            {"nombre": "Salsa de ensalada", "unidad_medida": "l", "costo_unitario": 4.00, "descripcion": "Aderezo para ensaladas"},
            {"nombre": "Sal y pimienta", "unidad_medida": "kg", "costo_unitario": 1.00, "descripcion": "Sazonadores"},
            
            # Aceite
            {"nombre": "Aceite de girasol", "unidad_medida": "l", "costo_unitario": 2.50, "descripcion": "Aceite para freír"},
        ]
        
        ingredientes_dict = {}
        for ing_data in ingredientes_data:
            ing = Ingrediente(**ing_data)
            db.session.add(ing)
            db.session.flush()
            ingredientes_dict[ing.nombre] = ing
        
        db.session.commit()
        print(f"✓ {len(ingredientes_dict)} ingredientes creados")
        
        # 3. Crear recetas
        print("Creando recetas...")
        
        # HAMBURGUESA CLÁSICA
        hamburguesa = Receta(
            usuario_id=usuario.id,
            nombre="Hamburguesa Clásica",
            descripcion="Hamburguesa de carne con queso, lechuga y tomate",
            rendimiento_porciones=1,
            precio_venta=8.50
        )
        db.session.add(hamburguesa)
        db.session.flush()
        
        # Ingredientes de la hamburguesa
        hamburguesa_ingredientes = [
            (ingredientes_dict["Carne de res molida"], 0.25),
            (ingredientes_dict["Pan de hamburguesa"], 1),
            (ingredientes_dict["Queso cheddar"], 0.05),
            (ingredientes_dict["Lechuga"], 0.03),
            (ingredientes_dict["Tomate"], 0.05),
            (ingredientes_dict["Cebolla"], 0.02),
            (ingredientes_dict["Mayonesa"], 0.02),
            (ingredientes_dict["Ketchup"], 0.02),
        ]
        
        costo_total_hamburguesa = 0
        for ingrediente, cantidad in hamburguesa_ingredientes:
            costo = cantidad * ingrediente.costo_unitario
            costo_total_hamburguesa += costo
            ri = RecetaIngrediente(
                receta=hamburguesa,
                ingrediente=ingrediente,
                cantidad=cantidad,
                costo_calculado=costo
            )
            db.session.add(ri)
        
        hamburguesa.costo_total = round(costo_total_hamburguesa, 2)
        hamburguesa.costo_por_porcion = round(costo_total_hamburguesa, 2)
        hamburguesa.margen_porcentaje = round(((hamburguesa.precio_venta - costo_total_hamburguesa) / costo_total_hamburguesa * 100), 2)
        hamburguesa.utilidad_total = round((hamburguesa.precio_venta - costo_total_hamburguesa) * hamburguesa.rendimiento_porciones, 2)
        
        # HAMBURGUESA DOBLE
        hamburguesa_doble = Receta(
            usuario_id=usuario.id,
            nombre="Hamburguesa Doble",
            descripcion="Hamburguesa con doble carne y doble queso",
            rendimiento_porciones=1,
            precio_venta=12.50
        )
        db.session.add(hamburguesa_doble)
        db.session.flush()
        
        hamburguesa_doble_ingredientes = [
            (ingredientes_dict["Carne de res molida"], 0.50),
            (ingredientes_dict["Pan de hamburguesa"], 1),
            (ingredientes_dict["Queso cheddar"], 0.10),
            (ingredientes_dict["Lechuga"], 0.03),
            (ingredientes_dict["Tomate"], 0.05),
            (ingredientes_dict["Cebolla"], 0.02),
            (ingredientes_dict["Mayonesa"], 0.02),
            (ingredientes_dict["Ketchup"], 0.02),
        ]
        
        costo_total_doble = 0
        for ingrediente, cantidad in hamburguesa_doble_ingredientes:
            costo = cantidad * ingrediente.costo_unitario
            costo_total_doble += costo
            ri = RecetaIngrediente(
                receta=hamburguesa_doble,
                ingrediente=ingrediente,
                cantidad=cantidad,
                costo_calculado=costo
            )
            db.session.add(ri)
        
        hamburguesa_doble.costo_total = round(costo_total_doble, 2)
        hamburguesa_doble.costo_por_porcion = round(costo_total_doble, 2)
        hamburguesa_doble.margen_porcentaje = round(((hamburguesa_doble.precio_venta - costo_total_doble) / costo_total_doble * 100), 2)
        hamburguesa_doble.utilidad_total = round((hamburguesa_doble.precio_venta - costo_total_doble) * hamburguesa_doble.rendimiento_porciones, 2)
        
        # ENSALADA CÉSAR
        ensalada_cesar = Receta(
            usuario_id=usuario.id,
            nombre="Ensalada César",
            descripcion="Ensalada fresca con lechuga, queso y aderezo César",
            rendimiento_porciones=1,
            precio_venta=7.50
        )
        db.session.add(ensalada_cesar)
        db.session.flush()
        
        ensalada_cesar_ingredientes = [
            (ingredientes_dict["Lechuga romana"], 0.15),
            (ingredientes_dict["Queso fresco"], 0.05),
            (ingredientes_dict["Tomate"], 0.08),
            (ingredientes_dict["Cebolla"], 0.02),
            (ingredientes_dict["Salsa de ensalada"], 0.05),
            (ingredientes_dict["Sal y pimienta"], 0.01),
        ]
        
        costo_total_cesar = 0
        for ingrediente, cantidad in ensalada_cesar_ingredientes:
            costo = cantidad * ingrediente.costo_unitario
            costo_total_cesar += costo
            ri = RecetaIngrediente(
                receta=ensalada_cesar,
                ingrediente=ingrediente,
                cantidad=cantidad,
                costo_calculado=costo
            )
            db.session.add(ri)
        
        ensalada_cesar.costo_total = round(costo_total_cesar, 2)
        ensalada_cesar.costo_por_porcion = round(costo_total_cesar, 2)
        ensalada_cesar.margen_porcentaje = round(((ensalada_cesar.precio_venta - costo_total_cesar) / costo_total_cesar * 100), 2)
        ensalada_cesar.utilidad_total = round((ensalada_cesar.precio_venta - costo_total_cesar) * ensalada_cesar.rendimiento_porciones, 2)
        
        # ENSALADA DE POLLO
        ensalada_pollo = Receta(
            usuario_id=usuario.id,
            nombre="Ensalada de Pollo",
            descripcion="Ensalada fresca con pollo deshilachado",
            rendimiento_porciones=1,
            precio_venta=8.50
        )
        db.session.add(ensalada_pollo)
        db.session.flush()
        
        ensalada_pollo_ingredientes = [
            (ingredientes_dict["Lechuga romana"], 0.15),
            (ingredientes_dict["Pollo deshilachado"], 0.15),
            (ingredientes_dict["Tomate"], 0.08),
            (ingredientes_dict["Pepino"], 0.06),
            (ingredientes_dict["Queso fresco"], 0.05),
            (ingredientes_dict["Salsa de ensalada"], 0.05),
            (ingredientes_dict["Sal y pimienta"], 0.01),
        ]
        
        costo_total_pollo = 0
        for ingrediente, cantidad in ensalada_pollo_ingredientes:
            costo = cantidad * ingrediente.costo_unitario
            costo_total_pollo += costo
            ri = RecetaIngrediente(
                receta=ensalada_pollo,
                ingrediente=ingrediente,
                cantidad=cantidad,
                costo_calculado=costo
            )
            db.session.add(ri)
        
        ensalada_pollo.costo_total = round(costo_total_pollo, 2)
        ensalada_pollo.costo_por_porcion = round(costo_total_pollo, 2)
        ensalada_pollo.margen_porcentaje = round(((ensalada_pollo.precio_venta - costo_total_pollo) / costo_total_pollo * 100), 2)
        ensalada_pollo.utilidad_total = round((ensalada_pollo.precio_venta - costo_total_pollo) * ensalada_pollo.rendimiento_porciones, 2)
        
        # PAPAS FRITAS
        papas_fritas = Receta(
            usuario_id=usuario.id,
            nombre="Papas Fritas",
            descripcion="Papas fritas crujientes y sazonadas",
            rendimiento_porciones=1,
            precio_venta=3.50
        )
        db.session.add(papas_fritas)
        db.session.flush()
        
        papas_fritas_ingredientes = [
            (ingredientes_dict["Papas"], 0.30),
            (ingredientes_dict["Aceite de girasol"], 0.05),
            (ingredientes_dict["Sal y pimienta"], 0.01),
        ]
        
        costo_total_papas = 0
        for ingrediente, cantidad in papas_fritas_ingredientes:
            costo = cantidad * ingrediente.costo_unitario
            costo_total_papas += costo
            ri = RecetaIngrediente(
                receta=papas_fritas,
                ingrediente=ingrediente,
                cantidad=cantidad,
                costo_calculado=costo
            )
            db.session.add(ri)
        
        papas_fritas.costo_total = round(costo_total_papas, 2)
        papas_fritas.costo_por_porcion = round(costo_total_papas, 2)
        papas_fritas.margen_porcentaje = round(((papas_fritas.precio_venta - costo_total_papas) / costo_total_papas * 100), 2)
        papas_fritas.utilidad_total = round((papas_fritas.precio_venta - costo_total_papas) * papas_fritas.rendimiento_porciones, 2)
        
        # PAPAS FRITAS GOURMET
        papas_gourmet = Receta(
            usuario_id=usuario.id,
            nombre="Papas Fritas Gourmet",
            descripcion="Papas fritas con queso y tocino",
            rendimiento_porciones=1,
            precio_venta=5.50
        )
        db.session.add(papas_gourmet)
        db.session.flush()
        
        papas_gourmet_ingredientes = [
            (ingredientes_dict["Papas"], 0.30),
            (ingredientes_dict["Aceite de girasol"], 0.05),
            (ingredientes_dict["Queso cheddar"], 0.08),
            (ingredientes_dict["Sal y pimienta"], 0.01),
        ]
        
        costo_total_gourmet = 0
        for ingrediente, cantidad in papas_gourmet_ingredientes:
            costo = cantidad * ingrediente.costo_unitario
            costo_total_gourmet += costo
            ri = RecetaIngrediente(
                receta=papas_gourmet,
                ingrediente=ingrediente,
                cantidad=cantidad,
                costo_calculado=costo
            )
            db.session.add(ri)
        
        papas_gourmet.costo_total = round(costo_total_gourmet, 2)
        papas_gourmet.costo_por_porcion = round(costo_total_gourmet, 2)
        papas_gourmet.margen_porcentaje = round(((papas_gourmet.precio_venta - costo_total_gourmet) / costo_total_gourmet * 100), 2)
        papas_gourmet.utilidad_total = round((papas_gourmet.precio_venta - costo_total_gourmet) * papas_gourmet.rendimiento_porciones, 2)
        
        db.session.commit()
        
        print(f"✓ 6 recetas creadas (2 hamburguesas, 2 ensaladas, 2 órdenes de papas fritas)")
        
        # Resumen
        print("\n" + "="*60)
        print("✅ BASE DE DATOS POBLADA EXITOSAMENTE")
        print("="*60)
        print(f"✓ Usuarios: 1 (admin@test.com / admin123)")
        print(f"✓ Ingredientes: {len(ingredientes_dict)}")
        print(f"✓ Recetas:")
        print(f"   - Hamburguesa Clásica: $8.50 (Costo: ${hamburguesa.costo_total}, Margen: {hamburguesa.margen_porcentaje}%)")
        print(f"   - Hamburguesa Doble: $12.50 (Costo: ${hamburguesa_doble.costo_total}, Margen: {hamburguesa_doble.margen_porcentaje}%)")
        print(f"   - Ensalada César: $7.50 (Costo: ${ensalada_cesar.costo_total}, Margen: {ensalada_cesar.margen_porcentaje}%)")
        print(f"   - Ensalada de Pollo: $8.50 (Costo: ${ensalada_pollo.costo_total}, Margen: {ensalada_pollo.margen_porcentaje}%)")
        print(f"   - Papas Fritas: $3.50 (Costo: ${papas_fritas.costo_total}, Margen: {papas_fritas.margen_porcentaje}%)")
        print(f"   - Papas Fritas Gourmet: $5.50 (Costo: ${papas_gourmet.costo_total}, Margen: {papas_gourmet.margen_porcentaje}%)")
        print("="*60)

if __name__ == '__main__':
    seed_database()
