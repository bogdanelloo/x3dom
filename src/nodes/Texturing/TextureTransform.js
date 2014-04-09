/** @namespace x3dom.nodeTypes */
/*
 * X3DOM JavaScript Library
 * http://www.x3dom.org
 *
 * (C)2009 Fraunhofer IGD, Darmstadt, Germany
 * Dual licensed under the MIT and GPL
 */

/* ### TextureTransform ### */
x3dom.registerNodeType(
    "TextureTransform",
    "Texturing",
    defineClass(x3dom.nodeTypes.X3DTextureTransformNode,
        
        /**
         * Constructor for TextureTransform
         * @constructs x3dom.nodeTypes.TextureTransform
         * @x3d x.x
         * @component Texturing
         * @status experimental
         * @extends x3dom.nodeTypes.X3DTextureTransformNode
         * @param {Object} [ctx=null] - context object, containing initial settings like namespace
         */
        function (ctx) {
            x3dom.nodeTypes.TextureTransform.superClass.call(this, ctx);


            /**
             *
             * @var {SFVec2f} center
             * @memberof x3dom.nodeTypes.TextureTransform
             * @initvalue 0,0
             * @field x3dom
             * @instance
             */
            this.addField_SFVec2f(ctx, 'center', 0, 0);

            /**
             *
             * @var {SFFloat} rotation
             * @memberof x3dom.nodeTypes.TextureTransform
             * @initvalue 0
             * @field x3dom
             * @instance
             */
            this.addField_SFFloat(ctx, 'rotation', 0);

            /**
             *
             * @var {SFVec2f} scale
             * @memberof x3dom.nodeTypes.TextureTransform
             * @initvalue 1,1
             * @field x3dom
             * @instance
             */
            this.addField_SFVec2f(ctx, 'scale', 1, 1);

            /**
             *
             * @var {SFVec2f} translation
             * @memberof x3dom.nodeTypes.TextureTransform
             * @initvalue 0,0
             * @field x3dom
             * @instance
             */
            this.addField_SFVec2f(ctx, 'translation', 0, 0);

            //Tc' = -C * S * R * C * T * Tc
            var negCenter = new x3dom.fields.SFVec3f(-this._vf.center.x, -this._vf.center.y, 1);
            var posCenter = new x3dom.fields.SFVec3f(this._vf.center.x, this._vf.center.y, 0);
            var trans3 = new x3dom.fields.SFVec3f(this._vf.translation.x, this._vf.translation.y, 0);
            var scale3 = new x3dom.fields.SFVec3f(this._vf.scale.x, this._vf.scale.y, 0);

            this._trafo = x3dom.fields.SFMatrix4f.translation(negCenter).
                mult(x3dom.fields.SFMatrix4f.scale(scale3)).
                mult(x3dom.fields.SFMatrix4f.rotationZ(this._vf.rotation)).
                mult(x3dom.fields.SFMatrix4f.translation(posCenter.add(trans3)));
        
        },
        {
            fieldChanged: function (fieldName) {
                //Tc' = -C * S * R * C * T * Tc
                if (fieldName == 'center' || fieldName == 'rotation' ||
                    fieldName == 'scale' || fieldName == 'translation') {

                    var negCenter = new x3dom.fields.SFVec3f(-this._vf.center.x, -this._vf.center.y, 1);
                    var posCenter = new x3dom.fields.SFVec3f(this._vf.center.x, this._vf.center.y, 0);
                    var trans3 = new x3dom.fields.SFVec3f(this._vf.translation.x, this._vf.translation.y, 0);
                    var scale3 = new x3dom.fields.SFVec3f(this._vf.scale.x, this._vf.scale.y, 0);

                    this._trafo = x3dom.fields.SFMatrix4f.translation(negCenter).
                        mult(x3dom.fields.SFMatrix4f.scale(scale3)).
                        mult(x3dom.fields.SFMatrix4f.rotationZ(this._vf.rotation)).
                        mult(x3dom.fields.SFMatrix4f.translation(posCenter.add(trans3)));
                }
            },

            texTransformMatrix: function() {
                return this._trafo;
            }
        }
    )
);