class CreateUsers < ActiveRecord::Migration[5.1]
  def change
    create_table :users do |t|
      t.string :email, null: false
      t.string :password, null: false
      t.integer :orders, default: 0
      t.timestamps
    end
  end
end
