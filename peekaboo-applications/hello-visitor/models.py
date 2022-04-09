from mongoengine import DynamicDocument, StringField, ListField


class Profile(DynamicDocument):
    name = StringField(max_length=40, required=True)
    images = ListField(field=StringField(), required=True)

    def to_json(self):
        return {
            "_id": str(self.pk),
            "name": self.name,
            "images": self.images
        }
