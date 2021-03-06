class CreateDishes < ActiveRecord::Migration[5.1]
  def change
    create_table :dishes do |t|
      t.string :name, null: false
      t.decimal :price
      t.text :category, array: true, default: []
      t.timestamps
    end
  end
end
